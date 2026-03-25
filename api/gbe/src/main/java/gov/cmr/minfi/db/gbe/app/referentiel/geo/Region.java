package gov.cmr.minfi.db.gbe.app.referentiel.geo;

import gov.cmr.minfi.db.gbe.app.common.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "REGION")
public class Region extends BaseEntity {

    @Column(name = "CODE_REGION", nullable = false, unique = true, length = 2)
    private String codeRegion;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;
}