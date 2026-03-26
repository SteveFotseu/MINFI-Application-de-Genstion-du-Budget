//package gov.cmr.minfi.db.gbe.app.auth.impl;
//
//import gov.cmr.minfi.db.gbe.app.auth.AuthenticationService;
//import gov.cmr.minfi.db.gbe.app.auth.dto.request.AuthenticationRequest;
//import gov.cmr.minfi.db.gbe.app.auth.dto.request.RefreshRequest;
//import gov.cmr.minfi.db.gbe.app.auth.dto.request.RegistrationRequest;
//import gov.cmr.minfi.db.gbe.app.auth.dto.request.VerificationRequest;
//import gov.cmr.minfi.db.gbe.app.auth.dto.response.AuthenticationResponse;
//import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
//import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
//import gov.cmr.minfi.db.gbe.app.iam.role.Role;
//import gov.cmr.minfi.db.gbe.app.iam.role.RoleRepository;
//import gov.cmr.minfi.db.gbe.app.security.JwtService;
//import gov.cmr.minfi.db.gbe.app.auth.tfa.TwoFactorAuthenticationService;
//import gov.cmr.minfi.db.gbe.app.user.User;
//import gov.cmr.minfi.db.gbe.app.user.UserMapper;
//import gov.cmr.minfi.db.gbe.app.user.UserRepository;
//import jakarta.persistence.EntityNotFoundException;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.util.ArrayList;
//import java.util.List;
//
//@Service
//@Slf4j
//@RequiredArgsConstructor
//public class AuthenticationServiceV1Impl implements AuthenticationService {
//    private final AuthenticationManager authenticationManager;
//    private final PasswordEncoder passwordEncoder;
//    private final JwtService jwtService;
//    private final UserRepository userRepository;
//    private final RoleRepository roleRepository;
//    private final UserMapper userMapper;
//    private final TwoFactorAuthenticationService tfaService;
//
//
//    @Override
//    public AuthenticationResponse login(AuthenticationRequest request) {
//        final Authentication auth = authenticationManager.authenticate(
//                new UsernamePasswordAuthenticationToken(
//                        request.email(),
//                        request.password()
//                )
//        );
//
//        final User user = (User) auth.getPrincipal();
//        if (user == null) {
//            throw new EntityNotFoundException("User not found");
//        }
//
//        // Cas du 2FA ACTIF
//        if (user.isMfaEnabled()) {
//            return AuthenticationResponse.builder()
//                    .mfaEnabled(true)
//                    .build();
//        }
//        final String accessToken = this.jwtService.generateAccessToken(user.getUsername());
//        final String refreshToken = this.jwtService.generateRefreshToken(user.getUsername());
//        final String tokenType = "Bearer";
//
//        return AuthenticationResponse.builder()
//                .accessToken(accessToken)
//                .refreshToken(refreshToken)
//                .tokenType(tokenType)
//                .mfaEnabled(false)
//                .build();
//    }
//
//    @Override
//    @Transactional
//    public AuthenticationResponse register(RegistrationRequest request) {
//        checkValidity(request);
//
//        final Role userRole = this.roleRepository.findByName("ROLE_USER")
//                .orElseThrow(() -> new EntityNotFoundException("Role user does not exists"));
//
//        final List<Role> role = new ArrayList<>();
//        role.add(userRole);
//        final User user = this.userMapper.toUser(request);
//        user.setPassword(passwordEncoder.encode(request.password()));
//        user.setRole(role);
//
//        log.debug("Saving user {}", user);
//
//        // Gestion du cas 2FA actif, generer le secret
//        if (request.mfaEnabled()) {
//            String secret = tfaService.generateNewSecret();
//            user.setSecret(secret);
//            user.setMfaEnabled(true);
//        }
//
//        this.userRepository.save(user);
//
//        if (request.mfaEnabled()) {
//            String secret = user.getSecret();
//            String secretImageUri = tfaService.generateQrCodeImageUri(secret);
//
//            return AuthenticationResponse.builder()
//                    .mfaEnabled(true)
//                    .secretImageUri(secretImageUri)
//                    .build();
//        }
//
//        // Cas du 2FA INACTIF
//        String accessToken = jwtService.generateAccessToken(user.getUsername());
//        String refreshToken = jwtService.generateRefreshToken(user.getUsername());
//
//        return AuthenticationResponse.builder()
//                .accessToken(accessToken)
//                .refreshToken(refreshToken)
//                .tokenType("Bearer")
//                .mfaEnabled(false)
//                .build();
//    }
//
//
//    @Override
//    public AuthenticationResponse refreshToken(RefreshRequest request) {
//        final String newAccesToken = this.jwtService.refreshAccessToken(request.refreshToken());
//        final String tokenType = "Bearer";
//
//        return AuthenticationResponse.builder()
//                .accessToken(newAccesToken)
//                .refreshToken(request.refreshToken())
//                .tokenType(tokenType)
//                .build();
//
//    }
//
//    @Override
//    public AuthenticationResponse verifyCode(VerificationRequest request) {
//        User user = this.userRepository.findByEmailIgnoreCase(request.email())
//                .orElseThrow(() -> new EntityNotFoundException("User not found"));
//        if (tfaService.isNonOtpValid(user.getSecret(), request.code())) {
//            throw new BusinessException(ErrorCode.BAD_CREDENTIALS, "Code is not correct");
//        }
//        String accessToken = this.jwtService.generateAccessToken(user.getUsername());
//        String refreshToken = this.jwtService.generateRefreshToken(user.getUsername());
//        return AuthenticationResponse.builder()
//                .accessToken(accessToken)
//                .refreshToken(refreshToken)
//                .tokenType("Bearer")
//                .mfaEnabled(user.isMfaEnabled())
//                .build();
//    }
//
//
//    private void checkPasswords(String password, String confirmPassword) {
//        if (password == null || !confirmPassword.equals(password)) {
//            throw new BusinessException(ErrorCode.PASSWORD_MISMATCH);
//        }
//    }
//
//    private void checkUserPhoneNumber(String phoneNumber) {
//        final boolean phoneNumberExists = this.userRepository.existsByPhoneNumberIgnoreCase(phoneNumber);
//        if (phoneNumberExists) {
//            throw new BusinessException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
//        }
//    }
//
//    private void checkUserEmail(String email) {
//        final boolean emailExists = this.userRepository.existsByEmailIgnoreCase(email);
//        if (emailExists) {
//            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
//        }
//    }
//
//    private void checkValidity(RegistrationRequest request) {
//        checkUserEmail(request.email());
//        checkUserPhoneNumber(request.phoneNumber());
//        checkPasswords(request.password(), request.confirmPassword());
//    }
//}
