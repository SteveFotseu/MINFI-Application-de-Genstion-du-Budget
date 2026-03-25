package gov.cmr.minfi.db.gbe.app.referentiel.economique;

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
@Table(name = "TITRE_DEPENSE")
public class TitreDepense extends BaseEntity {


    // Titre 6 : Autres dépenses
    @Column(name = "CODE_TITRE", nullable = false, unique = true, length = 1)
    private String codeTitre;

    @Column(name = "LIBELLE_FR", nullable = false)
    private String libelleFr;

    @Column(name = "LIBELLE_EN", nullable = false)
    private String libelleEn;
}