package gov.cmr.minfi.db.gbe.app.common.config;

import gov.cmr.minfi.db.gbe.app.affectation.UserAffectation;
import gov.cmr.minfi.db.gbe.app.affectation.UserAffectationRepository;
import gov.cmr.minfi.db.gbe.app.auth.tfa.TwoFactorAuthenticationService;
import gov.cmr.minfi.db.gbe.app.exercice.Exercice;
import gov.cmr.minfi.db.gbe.app.exercice.ExerciceRepository;
import gov.cmr.minfi.db.gbe.app.iam.role.Role;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleRepository;
import gov.cmr.minfi.db.gbe.app.iam.role.RoleSysteme;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.Section;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.SectionRepository;
import gov.cmr.minfi.db.gbe.app.referentiel.administratif.TypeSection;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.Programme;
import gov.cmr.minfi.db.gbe.app.referentiel.programmatique.ProgrammeRepository;
import gov.cmr.minfi.db.gbe.app.user.User;
import gov.cmr.minfi.db.gbe.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final SectionRepository sectionRepository;
    private final ProgrammeRepository programmeRepository;
    private final ExerciceRepository exerciceRepository;
    private final UserAffectationRepository affectationRepository;
    private final TwoFactorAuthenticationService tfaService;
    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile("!prod")
    public CommandLineRunner init() {
        return args -> {

            // ================================================
            // ETAPE 1 — Initialisation des rôles du système
            // ================================================
            for (RoleSysteme roleSysteme : RoleSysteme.values()) {
                final String roleName = "ROLE_" + roleSysteme.name();
                if (roleRepository.findByName(roleName).isEmpty()) {
                    final Role role = new Role();
                    role.setName(roleName);
                    role.setCreatedBy("SYSTEM");
                    roleRepository.save(role);
                    log.info("Role initialisé : {}", roleName);
                }
            }

            // Si les données de test existent déjà on s'arrête ici
            if (userRepository.existsByEmailIgnoreCase("admin@minfi.cm")) {
                log.info("Données de test déjà présentes — initialisation ignorée");
                return;
            }

            // ================================================
            // ETAPE 2 — Exercice budgétaire
            // ================================================
            final Exercice exercice = exerciceRepository.save(
                    Exercice.builder()
                            .annee(2026)
                            .libelleFr("Exercice budgétaire 2026")
                            .libelleEn("Budget exercise 2026")
                            .actif(true)
                            .build()
            );
            log.info("Exercice créé : {}", exercice.getAnnee());

            // ================================================
            // ETAPE 3 — Section
            // ================================================
            final Section section = sectionRepository.save(
                    Section.builder()
                            .codeSection("20")
                            .sigle("MINFI")
                            .libelleFr("Ministère des Finances")
                            .libelleEn("Ministry of Finance")
                            .typeSection(TypeSection.MINISTERE)
                            .exercice(exercice)
                            .build()
            );
            log.info("Section créée : {}", section.getSigle());

            // ================================================
            // ETAPE 4 — Programmes
            // ================================================
            final Programme prog1 = programmeRepository.save(
                    Programme.builder()
                            .section(section)
                            .exercice(exercice)
                            .code("001")
                            .codeMille("60")
                            .libelleFr("Pilotage et coordination")
                            .libelleEn("Steering and coordination")
                            .actif(true)
                            .build()
            );

            final Programme prog2 = programmeRepository.save(
                    Programme.builder()
                            .section(section)
                            .exercice(exercice)
                            .code("002")
                            .codeMille("60")
                            .libelleFr("Mobilisation des ressources")
                            .libelleEn("Resource mobilization")
                            .actif(true)
                            .build()
            );
            log.info("Programmes créés : {}, {}", prog1.getCode(), prog2.getCode());

            // ================================================
            // ETAPE 5 — Utilisateur Admin
            // firstLogin=false car c'est un compte bootstrappé
            // mfaEnabled=true car le 2FA est déjà configuré
            // ================================================
            final Role roleAdmin = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow();

            final User admin = User.builder()
                    .firstName("Super")
                    .lastName("Admin")
                    .email("admin@minfi.cm")
                    .phoneNumber("+237600000000")
                    .password(passwordEncoder.encode("Admin@1234"))
                    .numeroCni("123456789")
                    .nui("NUI123456")
                    .cniIssueDate(LocalDate.of(2020, 1, 1))
                    .cniExpiryDate(LocalDate.of(2030, 1, 1))
                    .enabled(true)
                    .locked(false)
                    .credentialsExpired(false)
                    .emailVerified(true)
                    .phoneVerified(true)
                    .firstLogin(false)
                    .mfaEnabled(true)
                    .secret(tfaService.generateNewSecret())
                    .roles(List.of(roleAdmin))
                    .build();

            userRepository.saveAndFlush(admin);
            log.info("Admin créé : {}", admin.getEmail());

            // Affectation admin
            final UserAffectation affectationAdmin = UserAffectation.builder()
                    .user(admin)
                    .section(section)
                    .programme(prog1)
                    .roleSysteme(RoleSysteme.ADMIN)
                    .actif(true)
                    .build();
            affectationAdmin.initialiserPermissionsDepuisRole();
            affectationRepository.save(affectationAdmin);

            // ================================================
            // ETAPE 6 — Utilisateur test
            // firstLogin=true — simule une première connexion
            // mfaEnabled=false — QR code pas encore scanné
            // ================================================
            final Role roleOrdonnateur = roleRepository.findByName("ROLE_ORDONNATEUR_PRINCIPAL")
                    .orElseThrow();

            final User userTest = User.builder()
                    .firstName("Jean")
                    .lastName("Dupont")
                    .email("jean.dupont@minfi.cm")
                    .phoneNumber("+237611111111")
                    .password(passwordEncoder.encode("Test@1234"))
                    .numeroCni("987654321")
                    .nui("NUI654321")
                    .cniIssueDate(LocalDate.of(2021, 6, 1))
                    .cniExpiryDate(LocalDate.of(2031, 6, 1))
                    .enabled(true)
                    .locked(false)
                    .credentialsExpired(false)
                    .emailVerified(false)
                    .phoneVerified(false)
                    .firstLogin(true)
                    .mfaEnabled(false)
                    .secret(tfaService.generateNewSecret())
                    .roles(List.of(roleOrdonnateur))
                    .build();

            userRepository.saveAndFlush(userTest);
            log.info("User test créé : {}", userTest.getEmail());

            // Affectation user test
            final UserAffectation affectationTest = UserAffectation.builder()
                    .user(userTest)
                    .section(section)
                    .programme(prog2)
                    .roleSysteme(RoleSysteme.ORDONNATEUR_PRINCIPAL)
                    .actif(true)
                    .build();
            affectationTest.initialiserPermissionsDepuisRole();
            affectationRepository.save(affectationTest);

            // ================================================
            log.info("================================================");
            log.info("Initialisation terminée");
            log.info("Admin    : admin@minfi.cm       / Admin@1234");
            log.info("Test     : jean.dupont@minfi.cm / Test@1234");
            log.info("================================================");
        };
    }
}