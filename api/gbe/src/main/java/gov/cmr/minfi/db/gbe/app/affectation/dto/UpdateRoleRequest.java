package gov.cmr.minfi.db.gbe.app.affectation.dto;

import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
        @NotNull(message = "VALIDATION.AFFECTATION.ROLE.NOT_NULL")
        RoleSysteme roleSysteme
) {
}
