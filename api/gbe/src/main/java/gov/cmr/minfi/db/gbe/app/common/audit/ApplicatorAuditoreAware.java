package gov.cmr.minfi.db.gbe.app.common.audit;

import gov.cmr.minfi.db.gbe.app.user.User;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public class ApplicatorAuditoreAware implements AuditorAware<String> {
    @Override
    public Optional<String> getCurrentAuditor() {
        final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() ||
                authentication instanceof AnonymousAuthenticationToken) {
            return Optional.of("SYSTEM");
        }
        final User user = (User) authentication.getPrincipal();
        //assert user != null;
        return Optional.ofNullable(user.getId());
    }
}
