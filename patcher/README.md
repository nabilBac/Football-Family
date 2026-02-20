# 🔧 PATCHER - Event Dashboard Stepper + Accordions

## Ce que fait ce patcher :
- Remplace les **onglets** par un **stepper** + **accordions**
- Ajoute le **dark theme** professionnel
- Ajoute la **bannière CTA** dynamique ("Prochaine étape")
- **PRÉSERVE 100%** de ta logique existante (API calls, scoring, planning, brackets...)

## 📋 INSTRUCTIONS (3 étapes - 2 minutes)

### Étape 1 : Copier les 3 fichiers dans un dossier

Mets ces 3 fichiers **dans le même dossier** :
```
patcher/
  ├── apply-patch.js        ← Le script patcher
  ├── patch-render.js       ← Nouveau render() (stepper+accordions)
  └── patch-functions.js    ← Nouvelles fonctions (remplace initTabs)
```

### Étape 2 : Exécuter le patcher

Ouvre un terminal et lance :
```bash
cd patcher
node apply-patch.js ../src/main/resources/static/app/js/pages/admin/event.dashboard.page.js
```

⚠️ Adapte le chemin vers ton fichier `event.dashboard.page.js`

### Étape 3 : Tester

Redémarre ton serveur et ouvre le dashboard admin d'un événement.
Tu devrais voir le **stepper en haut** et les **sections en accordéon**.

## 🔄 ROLLBACK (si problème)

Le patcher crée automatiquement un backup. Pour revenir en arrière :
```bash
# Le script affiche le chemin du backup, par exemple :
cp event.dashboard.page.js.backup-1708... event.dashboard.page.js
```

Ou utilise Git :
```bash
git checkout -- src/main/resources/static/app/js/pages/admin/event.dashboard.page.js
```

## ℹ️ Ce qui change :
| Avant | Après |
|-------|-------|
| Onglets `.tab-btn` | Stepper + Accordions |
| `initTabs()` | `initAccordions()` + `initStepper()` |
| Pas de CTA | Bannière "Prochaine étape" dynamique |
| Fond clair | Dark theme `#0f1923` |
| Navigation horizontale | Scroll vertical (accordions) |

## ℹ️ Ce qui ne change PAS :
- Toutes les fonctions API (loadMatches, loadBracket, etc.)
- Le scoring, le planning, les brackets
- Les boutons d'action (générer poules, bracket, consolante)
- Le système de planning 1/2/3 jours
- Les modales (score, édition horaire)
- La logique de tournoi (start, finish, cancel, archive)
