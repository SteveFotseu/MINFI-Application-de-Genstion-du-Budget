package gov.cmr.minfi.db.gbe.app.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByEmailIgnoreCase(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByPhoneNumberIgnoreCase(String phoneNumber);

    boolean existsByNuiIgnoreCase(String nui);

    boolean existsByNumeroCniIgnoreCase(String numeroCni);

    boolean existsByMatriculeIgnoreCase(String matricule);
}
