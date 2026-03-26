package gov.cmr.minfi.db.gbe.app.iam.role;


import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import gov.cmr.minfi.db.gbe.app.user.User;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "ROLES")
public class Role extends BaseEntity {

    private String name;


    private List<User> users;
}
