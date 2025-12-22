# Trends in Biotechnology Review Paper Blueprint
## Lanthanide Bioseparation: From Pocket Engineering to Kinetic Control

**Last Updated:** December 2025  
**Status:** Presubmission Planning  
**Target Journal:** Trends in Biotechnology (Opinion/Review)

---

# PART I: STRATEGIC POSITIONING

## Core Thesis Statement

> "Selectivity in lanthanide bioseparations is not encoded in protein architecture but emerges from intrinsic metal coordination kinetics—a recognition that reorients engineering strategy from binding pocket optimization toward exploiting differential exchange dynamics."

---

## Thesis Strength Evaluation

| Criterion | Assessment | Evidence Strength |
|-----------|------------|-------------------|
| **Novelty of framing** | First paper to explicitly argue kinetics > thermodynamics for Ln selectivity | **Strong** — No existing review makes this claim |
| **Evidence base** | Multiple systems (LanM, Hans-LanM, α-lactalbumin) + mechanistic data | **Strong** — Both published literature + your unpublished results |
| **Timeliness** | Hans-LanM breakthrough (Nature 2023) demands mechanistic explanation | **Strong** — <2 years since major advance |
| **Actionability** | Clear design principles + chelator decision framework | **Strong** — Practitioners can immediately apply |
| **Debate potential** | Directly challenges 20+ years of pocket-centric design | **Strong** — Will provoke responses from LBT/directed evolution community |

---

## Paradigm Shift Framing

```
OLD PARADIGM: Selectivity encoded in binding pocket geometry
             (coordination number, ligand field, ionic radius matching)
                                    ↓
EVIDENCE OF LIMITATIONS:
  • Isolated EF-loops show μM affinity despite intact coordination residues
  • LBTs with >60-fold Kd variation show no adjacent-Ln selectivity
  • Calmodulin binds Ln³⁺ but cannot separate them
  • Synthetic chelators with "perfect" geometry still require 200+ stages
                                    ↓
NEW FRAMEWORK: Selectivity emerges from intrinsic metal-ligand exchange kinetics
              (kon, koff, water exchange rates, operational parameters)
                                    ↓
EXPLAINS:
  • Why LanM's "ordinary" koff still yields selectivity (exceptional kon)
  • Why α-lactalbumin achieves >98% purity via pH alone
  • Why Hans-LanM's quaternary structure—not binding pocket—doubles selectivity
  • Why chelators help for distant but not adjacent Ln pairs
                                    ↓
IMPLICATIONS:
  ✓ Engineer second-sphere interactions, not first-sphere ligands
  ✓ Treat operational parameters (pH, flow, T) as equivalent to mutations
  ✓ Use chelators only when orthogonality is confirmed
  ✓ Generic protein scaffolds may outperform "optimized" ones under kinetic control
```

---

## Anticipated Reviewer Objections

| Likely Objection | Preemptive Response | Where to Address |
|------------------|---------------------|------------------|
| **"Pocket engineering has achieved remarkable selectivity (10⁸-fold Ln/Ca)"** | Acknowledge this success explicitly, then clarify the distinction: pocket engineering solves Ln *vs.* non-Ln discrimination, NOT intra-Ln selectivity. Different problems require different approaches. | Section 2b (Paradigm successes) |
| **"The kinetic framework is speculative / lacks quantitative support"** | Cite Featherston 2021 kon/koff data + Helm & Merbach water exchange compilations. Present your α-lactalbumin as independent validation with quantitative purity metrics. | Section 3 (entire section) |
| **"α-Lactalbumin is one protein—this could be coincidental"** | Note that Hans-LanM's mechanism (quaternary structure, not pocket) independently validates kinetic control. Frame α-lactalbumin as proof that kinetic principles generalize beyond LanM-family proteins. | Section 3c |
| **"The chelator guidance is too prescriptive for a complex system"** | Frame as testable hypotheses, not rigid rules. Include "When to reconsider" caveats. Point to Dong et al. 2024 as partial validation. | Section 5 + Outstanding Questions |
| **"Scale-up claims are speculative without industrial data"** | Acknowledge explicitly that industrial validation is needed. Frame scale-up section as "implications" and "research agenda" rather than proven claims. Add TEA/LCA gap to Outstanding Questions. | Section 6 + Box 2 |
| **"This dismisses decades of valuable work"** | Never use dismissive language. Frame as "evolution of understanding"—each paradigm answered the questions available at its time. Pocket engineering was *necessary* to discover kinetic control. | Throughout, esp. Section 2 |

---

## What Makes This Paper Novel

1. **Conceptual reframing:** We argue the field has been optimizing the wrong variable (Kd/affinity) when kinetics (kon, koff, water exchange rates) actually control selectivity

2. **Mechanistic synthesis:** We connect disparate observations—LanM's "ordinary" koff, Hans-LanM's quaternary structure effects, α-lactalbumin's pH-dependent selectivity—into a unified kinetic framework

3. **Prescriptive utility:** We provide actionable design principles and a decision framework for chelator use, not just retrospective understanding

---

## Differentiation from Existing Literature

| Existing Work | What They Cover | What We Add |
|---------------|-----------------|-------------|
| Ye et al. (2024) *TiB* | Biomaterial engineering for REE recovery; peptide/protein discovery; immobilization strategies | Mechanistic *why* of selectivity; kinetic control framework; chelator decision rules |
| Cotruvo lab papers | Individual protein characterization; separation demonstrations | Cross-system synthesis; conceptual framework applicable beyond LanM |
| Biosorption reviews | Cell-surface binding; recovery from waste streams | Intra-lanthanide selectivity mechanisms (the harder problem) |
| 2025 CSR peptide review | Ln-binding peptide catalog | Kinetic vs. thermodynamic control as organizing principle |

---

## Key Selling Points for Editors

Per TiB guidelines:
- **Timeliness:** Recent breakthroughs (Hans-LanM Nature 2023, >98% single-step purity) demand mechanistic explanation
- **Debate potential:** Directly challenges pocket-centric design paradigm
- **Actionable:** Provides decision framework practitioners can use
- **Scale-up relevance:** Kinetic control via operational parameters may be *easier* to industrialize than protein engineering

---

# PART II: TITLE & ABSTRACT STRATEGY

## Title Options (Ranked)

1. **Beyond the Binding Pocket: Kinetic Control as the Mechanistic Basis for Lanthanide Selectivity in Biological Systems**
   — *Signals paradigm challenge; "Beyond" frames old vs. new*

2. **Rethinking Selectivity in Lanthanide Bioseparation: From Pocket Optimization to Kinetic Control**
   — *"Rethinking" explicitly positions as opinion; clear evolution narrative*

3. **Why Binding Affinity Isn't Enough: A Kinetic Framework for Lanthanide Bioseparation**
   — *Accessible; provocative question; emphasizes actionability*

**Recommendation:** Title 1 for presubmission inquiry (strongest paradigm signal). If editors prefer softer framing, pivot to Title 2.

---

## Abstract Blueprint (~150 words)

| Element | Content | Word Target |
|---------|---------|-------------|
| **Hook** | Recent breakthroughs achieving >98% single-step lanthanide purity demand mechanistic explanation. | 15-20 |
| **Old paradigm limitation** | For decades, the field has optimized binding pocket geometry to achieve selectivity—yet this approach fails for adjacent lanthanides differing by <0.02 Å in ionic radius. | 30-35 |
| **New framework claim** | We argue that intra-lanthanide selectivity is not encoded in protein architecture but emerges from intrinsic metal-ligand exchange kinetics, controlled by water displacement rates that vary 100-fold across the lanthanide series. | 35-40 |
| **Evidence preview** | This framework unifies disparate observations: lanmodulin's near-diffusion-limited association kinetics, the quaternary structure mechanism of Hans-LanM, and our finding that bovine α-lactalbumin achieves high neodymium purity through pH modulation alone. | 35-40 |
| **Implications** | This kinetic lens reorients engineering strategy—from first-sphere coordination residues toward second-sphere interactions, operational parameters, and chelator orthogonality—and suggests that generic protein scaffolds may outperform "optimized" ones under proper kinetic control. | 40-45 |

**Total: ~155 words** (within TiB range)

---

# PART III: SECTION-BY-SECTION OUTLINE

## Section 1: Introduction — The Selectivity Paradox
**Word target:** ~600 words

**Narrative strategy:** Open with a striking contrast that the old paradigm cannot resolve.

### Opening Sentence Options

1. *"Industrial solvent extraction achieves 99% lanthanide purity—but requires over 200 equilibrium stages. In 2023, a bacterial protein achieved comparable purity in a single step. This 200-fold reduction in complexity demands mechanistic explanation."*

2. *"Adjacent lanthanides differ by less than 0.02 Å in ionic radius—yet biological systems separate them with efficiencies that synthetic chemistry cannot match. Why?"*

3. *"After three decades optimizing binding pocket geometry, the field's best engineered proteins show 60-fold affinity variation across the lanthanide series—but almost no improvement in adjacent-element selectivity. We argue this reflects a fundamental misidentification of the rate-limiting step."*

**Recommended:** Option 1 (quantitative contrast is most compelling)

### Key Points to Make

| Subsection | Key Points | Essential Citations |
|------------|------------|---------------------|
| The industrial challenge | ~200 stages, toxic waste, geopolitical constraints | Xie et al. 2014; Cheisson & Schelter 2019 |
| The biological surprise | Single-step >98% purity; mild aqueous conditions | Mattocks et al. 2023 Nature |
| The puzzle | Pocket optimization predicts synthetic chelators should match this—they don't | LBT literature; HDEHP data |
| Thesis preview | Selectivity emerges from kinetics, not thermodynamics | — |

---

## Section 2: The Pocket-Centric Paradigm and Its Limits
**Word target:** ~800 words

**Narrative strategy:** Respectfully trace the paradigm's evolution, acknowledge its successes, then systematically expose where it breaks down.

### Opening Sentence Options

1. *"The dominant framework for understanding lanthanide selectivity has evolved through three generations: from simple charge matching, to ionic radius optimization, to sophisticated coordination geometry engineering."*

2. *"Pocket engineering has achieved undeniable successes—lanmodulin's 10⁸-fold preference for lanthanides over calcium represents one of the most selective metal-binding systems ever characterized."*

**Recommended:** Option 2 (lead with respect for the paradigm before critiquing)

### Structure

| Subsection | Purpose | Key Points |
|------------|---------|------------|
| 2a. Historical evolution | Establish legitimacy | Charge → radius → coordination number → pocket geometry |
| 2b. Paradigm successes | Acknowledge what it explains | LanM 10⁸-fold Ln/Ca; LBTs with nM Kd |
| 2c. The failure mode | Precisely identify breakdown | Affinity ≠ selectivity for adjacent Ln; isolated loops lose function |

### Evidence Table

| System | Paradigm Prediction | Actual Observation | Discrepancy |
|--------|--------------------|--------------------|-------------|
| LBTs | >60-fold Kd variation → proportional selectivity | Adjacent Ln separation factors ~1-2 | Affinity-selectivity disconnect |
| Isolated LanM EF-loops | Should retain affinity (coordination residues intact) | Kd > μM (1000× weaker) | Scaffold matters for affinity |
| Calmodulin | Should separate Ln (tight binding) | Binds Ln but no selectivity | Binding ≠ selectivity |
| Synthetic chelators | Optimized geometry → high selectivity | Require ~200 stages | Geometry alone insufficient |

### Key Rhetorical Move

> "Pocket engineering answers a different question than we realized. It determines *what* binds (Ln³⁺ vs. Ca²⁺); kinetics determines *which* lanthanide is released preferentially."

---

## Section 3: The Kinetic Control Hypothesis
**Word target:** ~1000 words (core of the paper)

**Narrative strategy:** Present the alternative framework with mechanistic rigor, show how it resolves Section 2 anomalies, then introduce α-lactalbumin as independent validation.

### Opening Sentence Options

1. *"What if selectivity arises not from how tightly proteins bind lanthanides, but from how quickly they capture and release them?"*

2. *"Recent mechanistic studies reveal a surprising finding: lanmodulin's dissociation kinetics are entirely ordinary among EF-hand proteins. Its selectivity emerges instead from exceptional association rates approaching the diffusion limit."*

**Recommended:** Option 2 (immediately provides the mechanism)

### Structure

| Subsection | Purpose | Key Arguments |
|------------|---------|---------------|
| 3a. The kon/koff revelation | State the new principle | LanM koff ordinary; kon exceptional (Featherston 2021) |
| 3b. Water exchange as hidden variable | Explain WHY this works | kex varies 100-fold across Ln series (Helm & Merbach) |
| 3c. α-Lactalbumin proof of concept | Independent validation | 98-100% Nd purity via pH alone; generic scaffold |
| 3d. Novel predictions | What this framework predicts | Flow rate matters; temperature unexploited; generic scaffolds viable |

### Reinterpretation Table

| Previous Finding | Original Interpretation | Reinterpretation Under Kinetic Framework |
|------------------|------------------------|------------------------------------------|
| LanM picomolar Kd | Tight binding = selectivity driver | Tight binding enables kinetic regime; koff/kon ratio is what matters |
| LBT affinity variation | Different Kd should give selectivity | Similar koff across Ln → no differential release → no selectivity |
| pH affects separation | Protonation competes with binding | pH modulates water exchange rates → tunes kinetic competition |
| Hans-LanM outperforms Mex-LanM | "Better evolved" pocket | Different mechanism entirely: quaternary structure amplifies kinetic differences |

### Key Figure Opportunity

**Figure 3: The Affinity-Selectivity Disconnect**
- X-axis: Binding affinity (Kd)
- Y-axis: Adjacent Ln separation factor
- Points: LBTs, LanM variants, α-lactalbumin, synthetic chelators
- Key message: No correlation; tighter binding ≠ better selectivity

---

## Section 4: Second-Sphere Interactions as Design Variables
**Word target:** ~700 words

**Narrative strategy:** Show how the kinetic framework explains recent structural breakthroughs (Hans-LanM) and opens new design space.

### Opening Sentence

*"If selectivity is kinetically controlled, where are the kinetic determinants encoded? Recent structural work points to an unexpected answer: the second coordination sphere and quaternary structure, not the binding pocket itself."*

### Key Topics

| Topic | Evidence Type | Source |
|-------|---------------|--------|
| Hans-LanM carboxylate shift | Structural (crystallography) | Mattocks et al. 2023 Nature |
| Coordinated water enhances affinity | Mutagenesis + affinity | Mattocks et al. 2022 Chem Sci |
| H-bonding network propagates selectivity | Dynamics (2D-IR) | Stroscio et al. |
| QM basis for water coordination effects | Computational | Wait et al. 2025 |

### Counterintuitive Finding to Highlight

> "In small-molecule chelators, excluding water from the coordination sphere enhances affinity. In protein systems, the opposite holds: coordinated water molecules *stabilize* lanthanide binding and provide selectivity handles."

---

## Section 5: Chelators as Kinetic Modulators — A Decision Framework
**Word target:** ~600 words

**Narrative strategy:** Translate the kinetic framework into actionable guidance for practitioners.

### Decision Framework

```
IF target lanthanides are >3 positions apart in series
   AND chelator selectivity trend is orthogonal to protein's
   → USE chelator-assisted elution (amplification)

IF target lanthanides are adjacent (<3 apart)
   → AVOID chelators; use pH modulation alone
   (chelators lack adjacent-element discrimination; may reduce selectivity)

IF target is Sc (unique kinetics)
   → USE malonate (exploits Sc-specific exchange rates)

WARNING SIGNS that chelators will hurt, not help:
  × Both protein and chelator show same selectivity trend
  × Chelator-Ln exchange faster than protein-Ln exchange
  × Process complexity scales with number of chelator steps
```

### Practical Guidance Table

| Separation Target | Old Approach | New Approach | Why Better |
|-------------------|--------------|--------------|------------|
| Adjacent Ln (Nd/Pr) | Trial chelator combinations | pH modulation alone | Chelators lack resolution; α-lactalbumin validates this |
| Grouped Ln (LREE/HREE) | Single chelator | Orthogonal chelator selection | Amplifies protein's intrinsic selectivity |
| Sc from REE mixture | Generic elution | Malonate specifically | Exploits Sc's unique kinetics |

### Your α-Lactalbumin as Counter-Example

> "Achieving 98-100% neodymium purity without chelators validates the minimalist kinetic approach: when operational parameters are properly tuned, adding complexity may reduce—not enhance—selectivity."

---

## Section 6: Engineering Implications and Future Directions
**Word target:** ~500 words

### Structure

| Element | Content |
|---------|---------|
| **What to stop doing** | Optimizing Kd as primary metric; mutating coordination residues first; assuming tight binding = selectivity |
| **What to start doing** | Screen for kinetic ratios; engineer second-sphere; optimize operational parameters |
| **Scale-up advantage** | Operational parameters tunable without new variants; generic scaffolds cheaper than engineered ones; continuous flow favors kinetic regime |
| **Research agenda** | Computational kinetic prediction; temperature as design variable; throughput limits; industrial validation |

---

# PART IV: BOX FEATURES

## Box 1: Glossary / Key Definitions

| Term | Definition |
|------|------------|
| **EF-hand** | Helix-loop-helix calcium-binding motif; canonical structural unit of many Ln-binding proteins |
| **kon** | Association rate constant (M⁻¹s⁻¹); rate of metal binding |
| **koff** | Dissociation rate constant (s⁻¹); rate of metal release |
| **kex** | Water exchange rate (s⁻¹); rate at which coordinated water molecules are replaced |
| **Separation factor (α)** | Ratio of distribution coefficients for two elements; α > 1 indicates preference |
| **First coordination sphere** | Atoms directly bonded to the metal ion |
| **Second coordination sphere** | Atoms hydrogen-bonded to first-sphere ligands; includes coordinated water |
| **Kinetic control** | Selectivity determined by relative rates (kon/koff), not equilibrium binding constants |
| **Thermodynamic control** | Selectivity determined by equilibrium binding affinities (Kd) |

## Box 2: Outstanding Questions

1. **Throughput limits:** What sets the speed limit for kinetic-controlled separations—binding capacity, intrinsic kinetics, or mass transfer?

2. **Generalizability:** Does the kinetic control framework apply across all EF-hand scaffolds? What about non-EF-hand proteins?

3. **Computational prediction:** Can we predict kinetic selectivity from sequence/structure without experiments? What features matter?

4. **Rational chelator design:** Can we engineer chelators with orthogonal selectivity to specific proteins?

5. **Adjacent element limits:** Is there a fundamental physical limit to adjacent-lanthanide selectivity, or can kinetic optimization overcome it?

6. **Industrial validation:** What are the TEA/LCA implications of protein-based vs. solvent extraction processes at scale?

---

# PART V: FIGURE STRATEGY

| Figure | Type | Purpose | Key Message |
|--------|------|---------|-------------|
| **Fig 1** | Conceptual schematic (full page) | Framework comparison | Old (pocket/Kd) vs. new (kinetics/kon/koff) paradigm side-by-side |
| **Fig 2** | Timeline | Historical context | Evolution: charge → geometry → kinetics; mark key papers |
| **Fig 3** | Data synthesis | Evidence for framework | Affinity-selectivity disconnect across systems |
| **Fig 4** | Mechanistic diagram | Kinetic basis | Water exchange rates across Ln series + correlation with selectivity |
| **Fig 5** | Structural comparison | Hans-LanM mechanism | Carboxylate shift; La vs. Dy; quaternary structure change |
| **Fig 6** | Decision flowchart | Practical guidance | Chelator selection framework for practitioners |

---

# PART VI: CRITICAL SUCCESS FACTORS

**For acceptance at TiB, this manuscript MUST:**

- [ ] **Clearly articulate a novel conceptual framework** — not just review literature *(Core thesis explicitly challenges pocket paradigm)*
- [ ] **Engage respectfully with the dominant paradigm** — acknowledge strengths before critiquing *(Section 2b dedicated to successes)*
- [ ] **Provide sufficient evidence** — framework must be evidence-based, not speculative *(Featherston kinetics + Helm & Merbach + your α-lactalbumin)*
- [ ] **Be timely** — connect to recent breakthroughs that make this relevant NOW *(Hans-LanM Nature 2023)*
- [ ] **Be actionable** — readers should know what to do differently *(Section 5 decision framework + Section 6)*
- [ ] **Anticipate objections** — address likely reviewer concerns proactively *(Objection table above; addressed in text)*

---

# PART VII: RISK ASSESSMENT & MITIGATION

| Risk | Likelihood | Mitigation Strategy |
|------|------------|---------------------|
| **"Not novel enough"** | Low | Explicitly compare to Ye et al. 2024; show how kinetic framing is absent from all existing reviews |
| **"Evidence insufficient"** | Medium | Ensure Featherston data is quantitative; include your α-lactalbumin with full purity data; add Hans-LanM structural evidence |
| **"Too narrow for TiB"** | Low | Emphasize sustainability angle; connect to critical materials supply chain; highlight industrial implications |
| **"Antagonizes key reviewers"** | Medium | Never dismissive of prior work; frame as "evolution" not "revolution"; suggest Cotruvo as reviewer (better to have expert than hostile reviewer) |
| **"Scale-up claims unsupported"** | Medium | Frame as "implications" and "research agenda" rather than proven; explicitly call for TEA/LCA studies |
| **"Prescriptive guidance too rigid"** | Low-Medium | Include "When to reconsider" caveats; frame chelator rules as "testable hypotheses" |

---

# PART VIII: PRESUBMISSION INQUIRY STRATEGY

**Target word count:** ~650 words (see Part II: Point-by-Point Summary)

**Key elements to emphasize:**

1. **Timeliness:** Hans-LanM Nature paper (2023) demonstrates breakthrough performance but lacks mechanistic framework; this paper provides it

2. **Novelty vs. existing reviews:** Ye et al. (2024) covers *what* systems exist; we explain *why* selectivity emerges and *how* to rationally exploit it

3. **Author positioning:** 
   - Banta lab has decades of protein engineering expertise
   - Your unpublished α-lactalbumin data provides independent validation
   - Kinetic framework emerged from your systematic pH optimization studies

4. **Debate potential:** Explicitly note that this challenges the pocket-centric design paradigm and will generate discussion

**Editors to target:** Check recent TiB mastheads for editors who have handled:
- Bioseparation/bioprocess papers
- Sustainable biotechnology
- Protein engineering reviews

---

# PART IX: TIMELINE & MILESTONES

| Phase | Tasks | Target | Status |
|-------|-------|--------|--------|
| Literature deep-dive | Gather all papers from Part IV checklist | +2-3 weeks | In progress |
| Outline finalization | Complete with all citations mapped | +3-4 weeks | **Current** |
| First draft | Full manuscript text | +5-6 weeks | Not started |
| Figures | All 6 figures + 2 boxes complete | +6-7 weeks | Not started |
| Internal review | Scott feedback + revisions | +7-8 weeks | Not started |
| Presubmission inquiry | Send to TiB editors | +8 weeks | Not started |
| Revision (if invited) | Address editor feedback | +9-10 weeks | — |
| Full submission | Complete manuscript + cover letter | +10-12 weeks | — |

---

# PART X: KEY ARGUMENTS SUMMARY

## The Three Core Claims

### Claim 1: Pocket engineering has reached its limits for intra-Ln selectivity
**Evidence:** 
- Isolated EF-loops lose affinity despite intact coordination (Gutenthaler 2022)
- LBT affinity variation doesn't translate to selectivity (Hatanaka 2020)
- Calmodulin binds Ln but cannot separate them

### Claim 2: Kinetics, not thermodynamics, control selectivity
**Evidence:**
- LanM's koff is "ordinary"; kon is exceptional (Featherston 2021)
- Water exchange rates vary 100-fold across Ln series (Helm & Merbach)
- α-Lactalbumin achieves high purity via pH alone (your work)

### Claim 3: Second-sphere interactions and operational parameters are the unexploited design space
**Evidence:**
- Hans-LanM's quaternary structure controls selectivity (Mattocks 2023)
- Coordinated water enhances affinity (Mattocks 2022)
- Chelator utility depends on kinetic orthogonality (Dong 2024)

---

# APPENDIX: LITERATURE CHECKLIST

## High Priority (Required Before Drafting)

- [ ] Helm & Merbach reviews — Quantitative kex values across Ln series
- [ ] Featherston et al. (2021) *JACS* — Full text for kon/koff data
- [ ] Gutenthaler et al. (2022) *Inorg Chem Front* — Isolated LanM peptides
- [ ] Mattocks et al. (2023) *Nature* — Full Hans-LanM structures + SI
- [ ] Mattocks et al. (2022) *Chem Sci* — D9N variant data
- [ ] Your α-lactalbumin manuscript/data — Quantitative purity metrics

## Medium Priority (Strengthen Arguments)

- [ ] Nitz et al. (2003, 2004) — LBT design papers for historical context
- [ ] Hatanaka et al. (2020) *Sci Rep* — LBT selectivity limitations
- [ ] Dong et al. (2024) *Sep Purif Technol* — Chelator comparison
- [ ] Cheisson & Schelter (2019) *Science* — Framing/context

## Lower Priority (Nice to Have)

- [ ] TEA/LCA on protein-based REE processes (if exists)
- [ ] Caravan papers on Gd contrast agent kinetics
- [ ] TALSPEAK process reviews (complexity comparison)

---

*Document version: 2.0 (Refined)*  
*Last updated: December 2025*
