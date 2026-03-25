package gov.cmr.minfi.db.gbe.app.user;

import gov.cmr.minfi.db.gbe.app.iam.permission.Permission;
import gov.cmr.minfi.db.gbe.app.iam.role.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "USERS")
@EntityListeners(AuditingEntityListener.class)
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "FIRST_NAME", nullable = false)
    private String firstName;

    @Column(name = "LAST_NAME", nullable = false)
    private String lastName;

    @Column(name = "EMAIL", nullable = false, unique = true)
    private String email;

    @Column(name = "PHONE_NUMBER", nullable = false, unique = true)
    private String phoneNumber;

    @Column(name = "PASSWORD", nullable = false)
    private String password;

    @Column(name = "DATE_OF_BIRTH")
    private LocalDate dateOfBirth;

    @Column(name = "MATRICULE")
    private String matricule;

    @Column(name = "NUMERO_CNI")
    private String numeroCni;

    @Column(name = "CNI_ISSUE_DATE")
    private LocalDate cniIssueDate;       // date de délivrance

    @Column(name = "CNI_EXPIRY_DATE")
    private LocalDate cniExpiryDate;      // date d'expiration

    @Column(name = "NUI")
    private String nui;

    // Statut du compte
    @Column(name = "IS_ENABLED")
    private boolean enabled;

    @Column(name = "IS_ACCOUNT_LOCKED")
    private boolean locked;

    @Column(name = "IS_EMAIL_VERIFIED")
    private boolean emailVerified;

    @Column(name = "PHONE_VERIFIED")
    private boolean phoneVerified;

    @Column(name = "CREDENTIALS_EXPIRED")
    private boolean credentialsExpired;

    @Column(name = "FIRST_LOGIN")
    @Builder.Default
    private boolean firstLogin = true;

    // 2FA
    @Column(name = "MFA_ENABLED")
    private boolean mfaEnabled;

    @Column(name = "MFA_SECRET")
    private String secret;

    // Audit
    @CreatedDate
    @Column(name = "CREATED_DATE", updatable = false, nullable = false)
    private LocalDate createdDate;

    @LastModifiedDate
    @Column(name = "LAST_MODIFIED_DATE", insertable = false)
    private LocalDateTime lastModifiedAt;

    @ManyToMany(
            cascade = {CascadeType.MERGE},
            fetch = FetchType.EAGER
    )
    @JoinTable(
            name = "USERS_ROLES",
            joinColumns = {@JoinColumn(name = "USERS_ID")},
            inverseJoinColumns = {@JoinColumn(name = "ROLES_ID")}
    )
    private List<Role> roles;

    @Transient
    private Set<Permission> grantedPermissions = new HashSet<>();


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        final List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        if (!CollectionUtils.isEmpty(this.roles)) {
            this.roles.forEach(role ->
                    authorities.add(new SimpleGrantedAuthority(role.getName()))
            );
        }

        if (!CollectionUtils.isEmpty(this.grantedPermissions)) {
            this.grantedPermissions.forEach(permission ->
                    authorities.add(new SimpleGrantedAuthority(permission.name()))
            );
        }

        return authorities;
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !this.locked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return !this.credentialsExpired;
    }
}