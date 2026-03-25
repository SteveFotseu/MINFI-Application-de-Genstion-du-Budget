package gov.cmr.minfi.db.gbe.app.admin.dto;

import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import lombok.Builder;

@Builder
public record AffectationSummary(
        String affectationId,
        RoleSysteme roleSysteme,
        String sectionId,
        String sectionLibelle,
        String programmeId,
        String programmeLibelle,
        boolean actif
) {
}
