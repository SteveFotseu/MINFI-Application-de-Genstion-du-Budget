package gov.cmr.minfi.db.gbe.app.admin;

import gov.cmr.minfi.db.gbe.app.admin.dto.CreateUserRequest;
import gov.cmr.minfi.db.gbe.app.admin.dto.UserSummaryResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_USERS')")
@Tag(name = "Admin", description = "Admin API")
public class AdminController {
    private final AdminService adminService;

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummaryResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return adminService.createUser(request);
    }

    @GetMapping("/users")
    @ResponseStatus(HttpStatus.OK)
    public List<UserSummaryResponse> getAllUsers() {
        return adminService.getAllUsers();
    }

    @GetMapping("/users/{userId}")
    @ResponseStatus(HttpStatus.OK)
    public UserSummaryResponse getUser(
            @PathVariable String userId
    ) {
        return adminService.getUser(userId);
    }

    @PatchMapping("/users/{userId}/activate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void activateUserAccount(
            @PathVariable String userId
    ) {
        adminService.activeUserAccount(userId);
    }

    @PatchMapping("/users/{userId}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateUserAccount(
            @PathVariable String userId
    ) {
        adminService.deactivateUserAccount(userId);
    }

    @DeleteMapping("/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUserAccount(
            @PathVariable String userId
    ) {
        adminService.deleteUserAccount(userId);
    }


}
