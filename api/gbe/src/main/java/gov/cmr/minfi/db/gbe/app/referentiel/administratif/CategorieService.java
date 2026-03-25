package gov.cmr.minfi.db.gbe.app.referentiel.administratif;

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
@Table(name = "CATEGORIE_SERVICE")
public class CategorieService extends BaseEntity {

    // 2 caractères — ex: "52", "33", "44"
    @Column(name = "CODE", nullable = false, unique = true, length = 2)
    private String code;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;

    @Enumerated(EnumType.STRING)
    @Column(name = "TYPE_ADMINISTRATION", nullable = false)
    private TypeAdministration typeAdministration;
}