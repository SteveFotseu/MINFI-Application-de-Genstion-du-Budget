package gov.cmr.minfi.db.gbe.app.referentiel.fonctionnel;

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
@Table(name = "DIVISION")
public class DivisionFonctionnelle extends BaseEntity {

    // 2 caractères — "01" à "10" selon NBE Art.15
    @Column(name = "CODE_DIVISION", nullable = false, unique = true, length = 2)
    private String codeDivision;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;
}