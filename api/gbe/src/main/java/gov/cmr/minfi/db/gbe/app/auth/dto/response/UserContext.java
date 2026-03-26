package gov.cmr.minfi.db.gbe.app.auth.dto.response;

import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import lombok.Builder;

import java.util.List;

@Builder
public record UserContext(
        String userId,
        String firstName,
        String lastName,
        String email,
        String matricule,
        String nui,
        String cni,
        RoleSysteme role,
        List<AffectationContext> affectations
) {

}
