package gov.cmr.minfi.db.gbe.app.user;

import gov.cmr.minfi.db.gbe.app.auth.dto.request.RegistrationRequest;
import gov.cmr.minfi.db.gbe.app.user.request.ProfileUpdateRequest;
import io.micrometer.common.util.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class UserMapper {
    public void mergeUserInfo(User user, ProfileUpdateRequest request) {
        if (StringUtils.isNotBlank(request.firstName())
                && !user.getFirstName().equals(request.firstName())) {
            user.setFirstName(request.firstName());
        }

        if (StringUtils.isNotBlank(request.lastName())
                && !user.getLastName().equals(request.lastName())) {
            user.setLastName(request.lastName());
        }

        if (request.dateOfBirth() != null && !request.dateOfBirth().equals(user.getDateOfBirth())) {
            user.setDateOfBirth(request.dateOfBirth());
        }

    }

    public User toUser(RegistrationRequest request) {
        return User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .phoneNumber(request.phoneNumber())
                .email(request.email())
                .enabled(true)
                .locked(false)
                .credentialsExpired(false)
                .emailVerified(false)
                .phoneVerified(false)
                .password(request.password())
                .build();
    }
}
