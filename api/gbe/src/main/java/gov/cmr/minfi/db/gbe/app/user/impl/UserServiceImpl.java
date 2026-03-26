package gov.cmr.minfi.db.gbe.app.user.impl;

import gov.cmr.minfi.db.gbe.app.affectation.UserAffectationRepository;
import gov.cmr.minfi.db.gbe.app.common.exception.BusinessException;
import gov.cmr.minfi.db.gbe.app.common.exception.ErrorCode;
import gov.cmr.minfi.db.gbe.app.iam.permission.Permission;
import gov.cmr.minfi.db.gbe.app.user.User;
import gov.cmr.minfi.db.gbe.app.user.UserMapper;
import gov.cmr.minfi.db.gbe.app.user.UserRepository;
import gov.cmr.minfi.db.gbe.app.user.UserServices;
import gov.cmr.minfi.db.gbe.app.user.request.ChangePasswordRequest;
import gov.cmr.minfi.db.gbe.app.user.request.ProfileUpdateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserServices, UserDetailsService {

    private final UserRepository userRepository;
    private final UserAffectationRepository affectationRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Override
    public UserDetails loadUserByUsername(final String userEmail) throws UsernameNotFoundException {
        final User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found : " + userEmail
                ));

        // Charger les permissions actives depuis les affectations
        final Set<Permission> permissions = affectationRepository
                .findByUserIdAndActifTrue(user.getId())
                .stream()
                .flatMap(affectation -> affectation.getPermissions().stream())
                .collect(Collectors.toSet());

        user.setGrantedPermissions(permissions);
        log.debug("User {} loaded with {} permission(s)", userEmail, permissions.size());

        return user;
    }

    @Override
    public void updateProfileInfo(ProfileUpdateRequest request, String userId) {
        User savedUser = this.userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));
        this.userMapper.mergeUserInfo(savedUser, request);
        this.userRepository.save(savedUser);
    }

    @Override
    public void changePassword(ChangePasswordRequest request, String userId) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BusinessException(ErrorCode.CHANGE_PASSWORD_MISMATCH);
        }
        User savedUser = this.userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));
        if (!this.passwordEncoder.matches(request.currentPassword(), savedUser.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_CURRENT_PASSWORD);
        }
        savedUser.setPassword(passwordEncoder.encode(request.newPassword()));
        this.userRepository.save(savedUser);
    }

    @Override
    public void deactivateAccount(String userId) {
        final User user = this.userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));
        if (!user.isEnabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_ALREADY_DEACTIVATED, userId);
        }
        user.setEnabled(false);
        this.userRepository.save(user);
    }

    @Override
    public void reactivateAccount(String userId) {
        final User user = this.userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND, userId));
        if (user.isEnabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_ALREADY_ACTIVATED);
        }
        user.setEnabled(true);
        this.userRepository.save(user);
    }

    @Override
    public void deleteAccount(String userId) {
        // TODO: implémenter la méthode
    }
}