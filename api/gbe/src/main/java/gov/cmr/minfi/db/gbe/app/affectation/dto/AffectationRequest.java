package gov.cmr.minfi.db.gbe.app.affectation.dto;

import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AffectationRequest(
        @NotBlank(message = "VALIDATION.AFFECTATION.PROGRAMME.NOT_BLANK")
        @Schema(example = "uuid-du-programme")
        String programmeId,

        @NotNull(message = "VALIDATION.AFFECTATION.ROLE.NOT_NULL")
        RoleSysteme roleSysteme

) {
}
