package gov.cmr.minfi.db.gbe.app.auth.dto.response;

import gov.cmr.minfi.db.gbe.app.iam.permission.Permission;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import lombok.Builder;

import java.util.Set;

@Builder
public record AffectationContext(
        String affectationId,
        RoleSysteme roleSysteme,
        String sectionId,
        String sectionLibelle,
        String sectionCode,
        String programmeId,
        String programmeLibelle,
        String programmeCode,
        Set<Permission> permissions,
        boolean actif
) {
}
