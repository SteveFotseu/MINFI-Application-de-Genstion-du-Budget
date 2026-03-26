package gov.cmr.minfi.db.gbe.app.budget.credit.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import gov.cmr.minfi.db.gbe.app.budget.credit.StatutCredit;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CreditBudgetaireResponse(
        String id,
        String codeImputation,

        // Classification administrative
        String exerciceId,
        Integer exerciceAnnee,
        String sectionId,
        String sectionLibelle,
        String sectionCode,
        String programmeId,
        String programmeLibelle,
        String programmeCode,
        String actionId,
        String actionLibelle,
        String chapitreId,
        String chapitreLibelle,

        // Montants AE
        BigDecimal montantAE,
        BigDecimal montantAEConsomme,
        BigDecimal montantAEDisponible,

        // Montants CP
        BigDecimal montantCP,
        BigDecimal montantCPConsomme,
        BigDecimal montantCPDisponible,

        // Statut
        StatutCredit statut,

        // Audit
        LocalDate createdDate
) {
}
