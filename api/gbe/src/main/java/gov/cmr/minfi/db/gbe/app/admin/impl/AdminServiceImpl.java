package gov.cmr.minfi.db.gbe.app.admin.impl;

import gov.cmr.minfi.db.gbe.app.admin.AdminService;
import gov.cmr.minfi.db.gbe.app.admin.dto.AffectationSummary;
import gov.cmr.minfi.db.gbe.app.admin.dto.CreateUserRequest;
import gov.cmr.minfi.db.gbe.app.admin.dto.UserSummaryResponse;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectation;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectationRepository;
import gov.cmr.minfi.db.gbe.app.auth.tfa.TwoFactorAuthenticationService;
import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
import gov.cmr.minfi.db.gbe.app.iam.role.Role;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleRepository;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Section;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.SectionRepository;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.Programme;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.ProgrammeRepository;
import gov.cmr.minfi.db.gbe.app.user.User;
import gov.cmr.minfi.db.gbe.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class AdminServiceImpl implements AdminService {
    private final UserRepository userRepository;
    private final SectionRepository sectionRepository;
    private final TwoFactorAuthenticationService tfaService;
    private final PasswordEncoder passwordEncoder;
    private final ProgrammeRepository programmeRepository;
    private final UserAffectationRepository userAffectationRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public UserSummaryResponse createUser(CreateUserRequest request) {
        // verifier l'existence de l'utilisateur en bd
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        if (userRepository.existsByPhoneNumberIgnoreCase(request.phoneNumber())) {
            throw new BusinessException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
        }

        if (userRepository.existsByNuiIgnoreCase(request.nui())) {
            throw new BusinessException(ErrorCode.NUI_ALREADY_EXISTS);
        }

        if (userRepository.existsByNumeroCniIgnoreCase(request.numeroCni())) {
            throw new BusinessException(ErrorCode.CNI_ALREADY_EXISTS);
        }

        if (userRepository.existsByMatriculeIgnoreCase(request.matricule())) {
            throw new BusinessException(ErrorCode.MATRICULE_ALREADY_EXISTS);
        }

        // recuperation de la section
        final Section section = sectionRepository.findById(request.sectionId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, request.sectionId()));

        final Role role = roleRepository.findByName("ROLE_" + request.roleSysteme().name())
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, request.roleSysteme().name()));

        // creation de l'utilisateur
        final User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .phoneNumber(request.phoneNumber())
                .password(passwordEncoder.encode(request.password()))
                .matricule(request.matricule())
                .nui(request.nui())
                .numeroCni(request.numeroCni())
                .cniIssueDate(request.cniIssueDate())
                .cniExpiryDate(request.cniExpiryDate())
                .enabled(true)
                .locked(false)
                .credentialsExpired(false)
                .emailVerified(false)
                .phoneVerified(false)
                .firstLogin(true)
                .secret(tfaService.generateNewSecret())
                .role(role)
                .build();

        userRepository.save(user);
        log.info("Created user {}", user.getEmail());

        // creation des affectation
        final List<UserAffectation> affectations = request.programmeIds().stream()
                .map(programmeId -> {
                    final Programme programme = programmeRepository.findById(programmeId)
                            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "programmeId" + programmeId));

                    final UserAffectation affectation = UserAffectation.builder()
                            .user(user)
                            .section(section)
                            .programme(programme)
                            .roleSysteme(request.roleSysteme())
                            .actif(true)
                            .build();

                    affectation.initialiserPermissionsDepuisRole();
                    return affectation;
                })
                .toList();

        userAffectationRepository.saveAll(affectations);
        log.info("{} affectation(s) crée(s) pour {}", affectations.size(), user.getEmail());


        return toResponse(user, affectations);
    }

    @Override
    public UserSummaryResponse getUser(String userId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "user:" + userId));

        // charger les affectations de l'utilisateur
        final List<UserAffectation> affectations = userAffectationRepository.findByUserId(userId);
        return toResponse(user, affectations);
    }

    @Override
    public List<UserSummaryResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> {
                    final List<UserAffectation> affectations =
                            userAffectationRepository.findByUserId(user.getId());
                    return toResponse(user, affectations);
                }).toList();

    }

    @Override
    @Transactional
    public void activeUserAccount(String userId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));

        if (user.isEnabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_ALREADY_ACTIVATED);
        }

        user.setEnabled(true);
        userRepository.save(user);

    }

    @Override
    @Transactional
    public void deactivateUserAccount(String userId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));

        if (!user.isEnabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_ALREADY_DEACTIVATED);
        }

        user.setEnabled(false);
        userRepository.save(user);

    }

    @Override
    public void deleteUserAccount(String userId) {
        final User utilisateur = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));

        userAffectationRepository.deleteAll(userAffectationRepository.findByUserId(userId));

        userRepository.delete(utilisateur);
        log.debug("Utilisateur supprimé : {}", utilisateur.getEmail());

    }

    private UserSummaryResponse toResponse(User user, List<UserAffectation> affectations) {
        final List<AffectationSummary> affectationSummaries = affectations.stream()
                .map(affectation -> AffectationSummary.builder()
                        .affectationId(affectation.getId())
                        .roleSysteme(affectation.getRoleSysteme())
                        .sectionId(affectation.getSection().getId())
                        .sectionLibelle(affectation.getSection().getLibelleFr())
                        .programmeId(affectation.getProgramme() != null ? affectation.getProgramme().getId() : null)
                        .programmeLibelle(affectation.getProgramme() != null ? affectation.getProgramme().getLibelleFr() : null)
                        .actif(affectation.isActif())
                        .build()
                ).toList();

        return UserSummaryResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .cniNumber(user.getNumeroCni())
                .matricule(user.getMatricule())
                .enabled(user.isEnabled())
                .firstLogin(user.isFirstLogin())
                .mfaEnabled(user.isMfaEnabled())
                .createdDate(user.getCreatedDate())
                .affectations(affectationSummaries)
                .role(RoleSysteme.valueOf(user.getRole().getName().replace("ROLE_", "")))
                .build();
    }
}
