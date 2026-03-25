package gov.cmr.minfi.db.gbe.app.affectation.impl;

import gov.cmr.minfi.db.gbe.app.admin.dto.AffectationSummary;
import gov.cmr.minfi.db.gbe.app.affectation.AffectationService;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectation;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectationRepository;
import gov.cmr.minfi.db.gbe.app.affectation.dto.AffectationRequest;
import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Section;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.Programme;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.ProgrammeRepository;
import gov.cmr.minfi.db.gbe.app.user.User;
import gov.cmr.minfi.db.gbe.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AffectationServiceImpl implements AffectationService {
    private final UserRepository userRepository;
    private final UserAffectationRepository userAffectationRepository;
    private final ProgrammeRepository programmeRepository;

    @Override
    @Transactional
    public AffectationSummary addAffectation(String userId, AffectationRequest request) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));

        // verifier que l'affectation n'existe pas déjà
        if (userAffectationRepository.existsByUserIdAndProgrammeId(userId, request.programmeId())) {
            throw new BusinessException(ErrorCode.AFFECTATION_ALREADY_EXISTS);
        }

        // recuperer le programme
        final Programme programme = programmeRepository.findById(request.programmeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, request.programmeId()));

        // recuperer la section depuis les affectaion existantes de l'utilisateur
        final Section section = userAffectationRepository.findByUserId(userId)
                .stream()
                .findFirst()
                .map(UserAffectation::getSection)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, "section introuvable pour cet utilisateur"));

        // creer la nouvelle affectation
        final UserAffectation affectation = UserAffectation.builder()
                .user(user)
                .section(section)
                .programme(programme)
                .roleSysteme(request.roleSysteme())
                .actif(true)
                .build();

        affectation.initialiserPermissionsDepuisRole();
        userAffectationRepository.save(affectation);
        log.info("Affectation ajoutée : user={} programme = {}", userId, request.programmeId());

        return toSummary(affectation);
    }

    @Override
    public List<AffectationSummary> getAffectations(String userId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));
        return userAffectationRepository.findByUserId(userId)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Override
    @Transactional
    public AffectationSummary updateRole(String userId, String affectationId, RoleSysteme roleSysteme) {
        final UserAffectation affectation = findAffectation(userId, affectationId);

        affectation.setRoleSysteme(roleSysteme);
        affectation.initialiserPermissionsDepuisRole();
        userAffectationRepository.save(affectation);

        log.info("Role modifié : affectation={} nouveauRole={}", affectationId, roleSysteme);

        return toSummary(affectation);
    }

    @Override
    @Transactional
    public void activateAffectation(String userId, String affectationId) {
        final UserAffectation affectation = findAffectation(userId, affectationId);

        if (affectation.isActif()) {
            throw new BusinessException(ErrorCode.AFFECTATION_ALREADY_ACTIVE);
        }

        affectation.setActif(true);
        userAffectationRepository.save(affectation);
        log.info("Affectation activée : {}", affectationId);
    }

    @Override
    public void deactivateAffectation(String userId, String affectationId) {
        final UserAffectation affectation = findAffectation(userId, affectationId);

        if (!affectation.isActif()) {
            throw new BusinessException(ErrorCode.AFFECTATION_ALREADY_INACTIVE);
        }

        affectation.setActif(false);
        userAffectationRepository.save(affectation);
        log.info("Affectation désactivée : {}", affectationId);
    }

    @Override
    @Transactional
    public void removeAffectation(String userId, String affectationId) {
        final UserAffectation affectation = findAffectation(userId, affectationId);
        userAffectationRepository.delete(affectation);
        log.info("Affectation supprimée : {}", affectationId);

    }

    private UserAffectation findAffectation(String userId, String affectationId) {
        final UserAffectation affectation = userAffectationRepository.findById(affectationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, affectationId));

        // verifier que l'affectation appartien bien à l'utilisateur

        if (!affectation.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.AFFECTATION_NOT_FOUND, userId);
        }

        return affectation;
    }

    private AffectationSummary toSummary(UserAffectation affectation) {
        return AffectationSummary.builder()
                .affectationId(affectation.getId())
                .roleSysteme(affectation.getRoleSysteme())
                .sectionId(affectation.getSection().getId())
                .sectionLibelle(affectation.getSection().getLibelleFr())
                .programmeId(affectation.getProgramme() != null ? affectation.getProgramme().getId() : null)
                .programmeLibelle(affectation.getProgramme() != null ? affectation.getProgramme().getLibelleFr() : null)
                .actif(affectation.isActif())
                .build();
    }
}
