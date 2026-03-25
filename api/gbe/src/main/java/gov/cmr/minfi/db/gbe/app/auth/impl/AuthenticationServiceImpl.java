package gov.cmr.minfi.db.gbe.app.auth.impl;

import gov.cmr.minfi.db.gbe.app.affectation.UserAffectation;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectationRepository;
import gov.cmr.minfi.db.gbe.app.auth.AuthenticationService;
import gov.cmr.minfi.db.gbe.app.auth.dto.request.*;
import gov.cmr.minfi.db.gbe.app.auth.dto.response.AffectationContext;
import gov.cmr.minfi.db.gbe.app.auth.dto.response.AuthenticationResponse;
import gov.cmr.minfi.db.gbe.app.auth.dto.response.UserContext;
import gov.cmr.minfi.db.gbe.app.auth.tfa.TwoFactorAuthenticationService;
import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
import gov.cmr.minfi.db.gbe.app.security.JwtService;
import gov.cmr.minfi.db.gbe.app.user.User;
import gov.cmr.minfi.db.gbe.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RequiredArgsConstructor
@Slf4j
@Service
public class AuthenticationServiceImpl implements AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final TwoFactorAuthenticationService tfaService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final UserAffectationRepository userAffectationRepository;


    @Override
    public AuthenticationResponse login(AuthenticationRequest request) {
        final Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        final User user = (User) auth.getPrincipal();
        if (user == null) {
            throw new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "user not found" + request.email());
        }

        // retourner le QR code si premiere connexion
        if (user.isFirstLogin()) {
            final String secretImageUri = tfaService.generateQrCodeImageUri(
                    user.getSecret());

            return AuthenticationResponse.builder()
                    .firstLogin(true)
                    .mfaEnabled(false)
                    .secretImageUri(secretImageUri)
                    .build();
        }

        // connexion suivantes  - code requis
        return AuthenticationResponse.builder()
                .firstLogin(false)
                .mfaEnabled(true)
                .build();
    }


    @Override
    public AuthenticationResponse verifyCode(VerificationRequest request) {
        final User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, request.email()));

        if (tfaService.isNonOtpValid(user.getSecret(), request.code())) {
            throw new BusinessException(ErrorCode.BAD_CREDENTIALS);
        }
        return buildResponse(user);
    }

    @Override
    @Transactional
    public AuthenticationResponse setupMfa(SetupMfaRequest request) {
        final User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, request.email()));

        // verifier si c'est la premiere connexion
        if (!user.isFirstLogin()) {
            throw new BusinessException(ErrorCode.MFA_ALREADY_CONFIRMED);
        }

        // Valider le code saisi après le code
        if (tfaService.isNonOtpValid(user.getSecret(), request.code())) {
            throw new BusinessException(ErrorCode.BAD_CREDENTIALS);
        }

        // Activer le 2FA et marquer la première connexion
        user.setMfaEnabled(true);
        user.setFirstLogin(false);
        userRepository.save(user);
        log.info("MFA activated for use {}", user.getEmail());
        return buildResponse(user);
    }

    @Override
    public AuthenticationResponse register(RegistrationRequest request) {
        return null;
    }

    @Override
    public AuthenticationResponse refreshToken(RefreshRequest request) {
        final String newSecretToken = jwtService.refreshAccessToken(request.refreshToken());


        return AuthenticationResponse.builder()
                .accessToken(newSecretToken)
                .refreshToken(request.refreshToken())
                .tokenType("Bearer")
                .build();

    }

    private AuthenticationResponse buildResponse(User user) {
        final List<UserAffectation> affectations = userAffectationRepository.findByUserIdAndActifTrue(user.getId());

        return AuthenticationResponse.builder()
                .accessToken(jwtService.generateAccessToken(user.getUsername()))
                .refreshToken(jwtService.generateRefreshToken(user.getUsername()))
                .tokenType("Bearer")
                .firstLogin(false)
                .mfaEnabled(true)
                .userContext(buildUserContext(user, affectations))
                .build();
    }

    private UserContext buildUserContext(User user, List<UserAffectation> affectations) {
        final List<AffectationContext> affectationsContext = affectations.stream()
                .map(affectation -> AffectationContext.builder()
                        .affectationId(affectation.getId())
                        .roleSysteme(affectation.getRoleSysteme())
                        .sectionId(affectation.getSection().getId())
                        .sectionLibelle(affectation.getSection().getLibelleFr())
                        .sectionCode(affectation.getSection().getCodeSection())
                        .programmeId(affectation.getProgramme() != null ? affectation.getProgramme().getId() : null)
                        .programmeLibelle(affectation.getProgramme() != null ? affectation.getProgramme().getLibelleFr() : null)
                        .programmeCode(affectation.getProgramme() != null ? affectation.getProgramme().getCode() : null)
                        .permissions(affectation.getPermissions())
                        .actif(affectation.isActif())
                        .build()
                ).toList();
        return UserContext.builder()
                .userId(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .affectations(affectationsContext)
                .build();
    }
}
