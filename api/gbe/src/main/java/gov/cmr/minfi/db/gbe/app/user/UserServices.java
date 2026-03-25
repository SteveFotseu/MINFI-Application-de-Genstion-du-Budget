package gov.cmr.minfi.db.gbe.app.user;

import gov.cmr.minfi.db.gbe.app.user.request.ChangePasswordRequest;
import gov.cmr.minfi.db.gbe.app.user.request.ProfileUpdateRequest;

public interface UserServices {
    void updateProfileInfo(ProfileUpdateRequest request, String userId);

    void changePassword(ChangePasswordRequest request, String userId);

    void deactivateAccount(String userId);

    void reactivateAccount(String userId);

    void deleteAccount(String userId);
}
