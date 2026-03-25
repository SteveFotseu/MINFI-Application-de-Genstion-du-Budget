package gov.cmr.minfi.db.gbe.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GbeApplication {

    public static void main(String[] args) {
        SpringApplication.run(GbeApplication.class, args);

    }

//    @Bean
//    public CommandLineRunner commandLineRunner(final RoleRepository roleRepository) {
//        return args -> {
//            final Optional<Role> userRole = roleRepository.findByName("ROLE_USER");
//            if (userRole.isEmpty()) {
//                Role role = new Role();
//                role.setName("ROLE_USER");
//                role.setCreatedBy("APP");
//                roleRepository.save(role);
//            }
//        };
//    }

}
