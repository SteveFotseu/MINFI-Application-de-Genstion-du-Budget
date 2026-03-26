package gov.cmr.minfi.db.gbe.app.budget.credit.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record UpdateCreditBudgetaireRequest(
        @NotNull(message = "VALIDATION.CREDIT.MONTANT.NOT_NULL")
        @DecimalMin(value = "0.01", message = "VALIDATION.CREDIT.MONTANT.MIN")
        BigDecimal montant
) {
}