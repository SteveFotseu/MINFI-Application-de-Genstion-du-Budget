package gov.cmr.minfi.db.gbe.app.admin;

import gov.cmr.minfi.db.gbe.app.admin.dto.CreateUserRequest;
import gov.cmr.minfi.db.gbe.app.admin.dto.UserSummaryResponse;

import java.util.List;

public interface AdminService {
    UserSummaryResponse createUser(CreateUserRequest request);

    UserSummaryResponse getUser(String userId);

    List<UserSummaryResponse> getAllUsers();

    void activeUserAccount(String userId);

    void deactivateUserAccount(String userId);

    void deleteUserAccount(String userId);
}
