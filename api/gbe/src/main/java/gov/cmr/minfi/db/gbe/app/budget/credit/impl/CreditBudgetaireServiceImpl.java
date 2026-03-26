package gov.cmr.minfi.db.gbe.app.budget.credit.impl;

import gov.cmr.minfi.db.gbe.app.budget.credit.CreditBudgetaire;
import gov.cmr.minfi.db.gbe.app.budget.credit.CreditBudgetaireRepository;
import gov.cmr.minfi.db.gbe.app.budget.credit.CreditBudgetaireService;
import gov.cmr.minfi.db.gbe.app.budget.credit.dto.CreateCreditRequest;
import gov.cmr.minfi.db.gbe.app.budget.credit.dto.CreditBudgetaireResponse;
import gov.cmr.minfi.db.gbe.app.budget.credit.dto.UpdateCreditBudgetaireRequest;
import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
import gov.cmr.minfi.db.gbe.app.exercice.Exercice;
import gov.cmr.minfi.db.gbe.app.exercice.ExerciceRepository;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Chapitre;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.ChapitreRepository;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Section;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.SectionRepository;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.Action;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.ActionRepository;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.Programme;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.ProgrammeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

import static gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode.ACTION_NOT_IN_PROGRAMME;

@Slf4j
@RequiredArgsConstructor
@Service
public class CreditBudgetaireServiceImpl implements CreditBudgetaireService {
    private final ChapitreRepository chapitreRepository;
    private final ActionRepository actionRepository;
    private final ProgrammeRepository programmeRepository;
    private final SectionRepository sectionRepository;
    private final ExerciceRepository exerciceRepository;
    private final CreditBudgetaireRepository creditBudgetaireRepository;

    @Override
    public CreditBudgetaireResponse createCredit(CreateCreditRequest request) {


        // charger les elements de references
        final Exercice exercice = findExercice(request.exerciceId());
        final Section section = findSection(request.sectionId());
        final Programme programme = findProgramme(request.programmeId());
        final Action action = findAction(request.actionId());
        final Chapitre chapitre = findChapitre(request.chapitreId());

        // verifier que le programme appartien à la section
        validateProgrammeBelongsToSection(programme, section);

        // veririfer que l'action appartion au programme
        validateActionsToProgramme(action, programme);

        // verifier que ce credit n'est pas encore creer
        validateImputationUniqueness(request);

        // calculer le code d'imputation
        final String codeImputation = buildImputationCode(exercice, section,
                programme, action, chapitre);

        final CreditBudgetaire credit = CreditBudgetaire.builder()
                .exercice(exercice)
                .section(section)
                .programme(programme)
                .action(action)
                .chapitre(chapitre)
                .codeImputation(codeImputation)
                .montantAE(request.montantAE())
                .montantCP(request.montantCP())
                .build();

        creditBudgetaireRepository.save(credit);
        log.info("Credit budgetaire created {} ", codeImputation);
        return toResponse(credit);
    }

    @Override
    public CreditBudgetaireResponse getCredit(String creditId) {
        return toResponse(findCredit(creditId));
    }

    @Override
    public List<CreditBudgetaireResponse> getCreditsByExercice(String exerciceId) {
        return creditBudgetaireRepository.findByExerciceId(exerciceId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<CreditBudgetaireResponse> getCreditsBySection(String sectionId, String exerciceId) {
        return creditBudgetaireRepository.findBySectionIdAndExerciceId(sectionId, exerciceId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<CreditBudgetaireResponse> getCreditsByProgramme(String programmeId) {
        return creditBudgetaireRepository.findByProgrammeId(programmeId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void updateAE(String creditId, UpdateCreditBudgetaireRequest request) {
        final CreditBudgetaire credit = findCredit(creditId);

        validateRevisionAE(credit, request.montant());

        credit.setMontantAE(request.montant());
        credit.setMontantAEDisponible(
                request.montant().subtract(credit.getMontantAEConsomme())
        );
        creditBudgetaireRepository.save(credit);
    }

    @Override
    @Transactional
    public void updateCP(String creditId, UpdateCreditBudgetaireRequest request) {
        final CreditBudgetaire credit = findCredit(creditId);

        validateRevisionCP(credit, request.montant());

        credit.setMontantCP(request.montant());
        credit.setMontantCPDisponible(request.montant()
                .subtract(credit.getMontantCPConsomme())); //
        creditBudgetaireRepository.save(credit);
        log.info("CP updated for credit {} : {}", creditId, request.montant());

    }

    @Override
    @Transactional
    public void commitCredit(String creditId) {
        final CreditBudgetaire credit = findCredit(creditId);
        credit.engager();
        creditBudgetaireRepository.save(credit);

    }

    @Override
    @Transactional
    public void freezeCredit(String creditId) {
        final CreditBudgetaire credit = findCredit(creditId);
        credit.bloquer();
        creditBudgetaireRepository.save(credit);

    }

    @Override
    @Transactional
    public void unfreezeCredit(String creditId) {
        final CreditBudgetaire credit = findCredit(creditId);
        credit.debloquer();
        creditBudgetaireRepository.save(credit);
        log.info("Credit unfrozen : {}", creditId);

    }

    @Override
    @Transactional
    public void closeCredit(String creditId) {
        final CreditBudgetaire credit = findCredit(creditId);
        credit.solder();
        creditBudgetaireRepository.save(credit);
        log.info("Credit budgetaire close {}", creditId);


    }

    @Override
    @Transactional
    public void cancelCredit(String creditId) {
        final CreditBudgetaire credit = findCredit(creditId);
        credit.annuler();
        creditBudgetaireRepository.save(credit);
        log.info("Credit {} canceled", creditId);

    }

    private void validateProgrammeBelongsToSection(Programme programme, Section section) {
        if (!programme.getSection().getId().equals(section.getId())) {
            throw new BusinessException(ErrorCode.PROGRAMME_NOT_IN_SECTION);
        }
    }

    private void validateActionsToProgramme(Action action, Programme programme) {
        if (!action.getProgramme().getId().equals(programme.getId())) {
            throw new BusinessException(ACTION_NOT_IN_PROGRAMME);
        }
    }

    private void validateImputationUniqueness(CreateCreditRequest request) {
        if (creditBudgetaireRepository.existsByExerciceIdAndSectionIdAndProgrammeIdAndActionIdAndChapitreId(
                request.exerciceId(), request.sectionId(),
                request.programmeId(), request.actionId(),
                request.chapitreId()
        )) {
            throw new BusinessException(ErrorCode.CREDIT_ALREADY_EXISTS);
        }
    }

    private void validateRevisionAE(CreditBudgetaire credit, BigDecimal nouveauMontant) {
        if (nouveauMontant.compareTo(credit.getMontantAEConsomme()) < 0) {
            throw new BusinessException(ErrorCode.NEW_AE_AMOUNT_LESS_THAN_CONSOMME);
        }
    }

    private void validateRevisionCP(CreditBudgetaire credit, BigDecimal nouveauMontant) {
        if (nouveauMontant.compareTo(credit.getMontantCPConsomme()) < 0) {
            throw new BusinessException(ErrorCode.NEW_CP_AMOUNT_LESS_THAN_CONSOMME);
        }
    }

    private CreditBudgetaire findCredit(String creditId) {
        return creditBudgetaireRepository.findById(creditId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, creditId));
    }

    private Exercice findExercice(String exerciceId) {
        return exerciceRepository.findById(exerciceId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, exerciceId));
    }

    private Section findSection(String sectionId) {
        return sectionRepository.findById(sectionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, sectionId));
    }

    private Programme findProgramme(String programmeId) {
        return programmeRepository.findById(programmeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, programmeId));
    }

    private Action findAction(String actionId) {
        return actionRepository.findById(actionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, actionId));
    }

    private Chapitre findChapitre(String chapitreId) {
        return chapitreRepository.findById(chapitreId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND, chapitreId));
    }


    private String buildImputationCode(
            Exercice exercice, Section section,
            Programme programme, Action action, Chapitre chapitre
    ) {
        return exercice.getCodeExercice()
                + section.getCodeSection()
                + programme.getCode()
                + action.getCodeAction()
                + chapitre.getCodeComplet();
    }

    private CreditBudgetaireResponse toResponse(CreditBudgetaire credit) {
        return CreditBudgetaireResponse.builder()
                .id(credit.getId())
                .codeImputation(credit.getCodeImputation())
                .exerciceId(credit.getExercice().getId())
                .exerciceAnnee(credit.getExercice().getAnnee())
                .sectionId(credit.getSection().getId())
                .sectionLibelle(credit.getSection().getLibelleFr())
                .sectionCode(credit.getSection().getCodeSection())
                .programmeId(credit.getProgramme().getId())
                .programmeLibelle(credit.getProgramme().getLibelleFr())
                .programmeCode(credit.getProgramme().getCode())
                .actionId(credit.getAction().getId())
                .actionLibelle(credit.getAction().getLibelleFr())
                .chapitreId(credit.getChapitre().getId())
                .chapitreLibelle(credit.getChapitre().getLibelleFr())
                .montantAE(credit.getMontantAE())
                .montantAEConsomme(credit.getMontantAEConsomme())
                .montantAEDisponible(credit.getMontantAEDisponible())
                .montantCP(credit.getMontantCP())
                .montantCPConsomme(credit.getMontantCPConsomme())
                .montantCPDisponible(credit.getMontantCPDisponible())
                .statut(credit.getStatut())
                .createdDate(credit.getCreatedDate())
                .build();
    }
}
