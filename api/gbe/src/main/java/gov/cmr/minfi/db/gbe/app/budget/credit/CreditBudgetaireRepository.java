package gov.cmr.minfi.db.gbe.app.budget.credit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CreditBudgetaireRepository extends JpaRepository<CreditBudgetaire, String> {


    Optional<CreditBudgetaire> findByCodeImputation(String codeImputation);

    boolean existsByCodeImputation(String codeImputation);

    List<CreditBudgetaire> findByExerciceId(String exerciceId);

    List<CreditBudgetaire> findByExerciceIdAndStatut(String exerciceId, StatutCredit statut);


    List<CreditBudgetaire> findBySectionId(String sectionId);

    List<CreditBudgetaire> findBySectionIdAndExerciceId(String sectionId, String exerciceId);


    List<CreditBudgetaire> findByProgrammeId(String programmeId);

    List<CreditBudgetaire> findByProgrammeIdAndStatut(String programmeId, StatutCredit statut);


    List<CreditBudgetaire> findByActionId(String actionId);


    List<CreditBudgetaire> findByChapitreId(String chapitreId);


    List<CreditBudgetaire> findByStatut(StatutCredit statut);


    // Vérification d'unicité de l'imputation  avant création
    boolean existsByExerciceIdAndSectionIdAndProgrammeIdAndActionIdAndChapitreId(
            String exerciceId,
            String sectionId,
            String programmeId,
            String actionId,
            String chapitreId
    );


    // Recherche combinée exercice + section + statut
    @Query("""
            SELECT c FROM CreditBudgetaire c
            WHERE c.exercice.id = :exerciceId
            AND c.section.id = :sectionId
            AND c.statut = :statut
            """)
    List<CreditBudgetaire> findByExerciceIdAndSectionIdAndStatut(
            @Param("exerciceId") String exerciceId,
            @Param("sectionId") String sectionId,
            @Param("statut") StatutCredit statut
    );


    // Tous les crédits actifs (non annulés, non soldés)  d'un exercice
    @Query("""
            SELECT c FROM CreditBudgetaire c
            WHERE c.exercice.id = :exerciceId
            AND c.statut NOT IN (
                gov.cmr.minfi.db.gbe.app.budget.credit.StatutCredit.ANNULE,
                gov.cmr.minfi.db.gbe.app.budget.credit.StatutCredit.SOLDE
            )
            """)
    List<CreditBudgetaire> findActifsByExerciceId(@Param("exerciceId") String exerciceId);
}