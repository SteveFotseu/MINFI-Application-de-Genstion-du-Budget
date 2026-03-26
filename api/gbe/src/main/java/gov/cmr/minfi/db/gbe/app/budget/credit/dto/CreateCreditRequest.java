package gov.cmr.minfi.db.gbe.app.budget.credit.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record CreateCreditRequest(
        @NotBlank(message = "VALIDATION.CREDIT.EXERCICE.NOT_BLANK")
        String exerciceId,

        @NotBlank(message = "VALIDATION.CREDIT.SECTION.NOT_BLANK")
        String sectionId,

        @NotBlank(message = "VALIDATION.CREDIT.PROGRAMME.NOT_BLANK")
        String programmeId,

        @NotBlank(message = "VALIDATION.CREDIT.ACTION.NOT_BLANK")
        String actionId,

        @NotBlank(message = "VALIDATION.CREDIT.CHAPITRE.NOT_BLANK")
        String chapitreId,

        @NotNull(message = "VALIDATION.CREDIT.MONTANT_AE.NOT_NULL")
        @DecimalMin(value = "0.00", message = "VALIDATION.CREDIT.MONTANT_AE.MIN")
        BigDecimal montantAE,

        @NotNull(message = "VALIDATION.CREDIT.MONTANT_CP.NOT_NULL")
        @DecimalMin(value = "0.00", message = "VALIDATION.CREDIT.MONTANT_CP.MIN")
        BigDecimal montantCP
) {
}
