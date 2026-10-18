# Focus Check

**Focus Check** is a short, research-inspired cognitive readiness check built with Next.js, React, and TypeScript. It combines brief attention, symbol–number matching, and response-inhibition tasks with an optional self-reported sleepiness rating.

The aim is to provide a quick snapshot of performance before studying or focused work—not to diagnose fatigue or determine whether someone is safe to perform an activity.

## How it works

1. **Sleepiness (optional):** Rate current sleepiness from 1–9 using a Karolinska Sleepiness Scale (KSS)-inspired question, or skip it.
2. **Alertness / reaction:** Quickly choose the larger of two numbers.
3. **Processing efficiency:** Match letters to digits using a visible key (inspired by the Digit Symbol Substitution Test, or DSST).
4. **Response control:** Respond to Go stimuli and withhold responses to No-Go stimuli.
5. **Results:** View an overall readiness estimate, three domain scores, accuracy and response-time summaries, and the optional sleepiness rating.

The app offers a **Mini** check (14 scored trials: 4 reaction, 4 matching, 6 Go/No-Go) and an **extended / “2min”** check (24 scored trials: 6 reaction, 8 matching, 10 Go/No-Go). Each task has instructions and optional unscored practice.

## Research background

The studies below motivate **which aspects of performance to examine**. They do **not** validate Focus Check's shortened tests or custom scoring rules.

### Vigilant attention — Hudson, Van Dongen & Honn (2020)

The review _Sleep deprivation, vigilant attention, and brain function_ describes how sleep deprivation affects vigilance, including slow responses, greater response-time variability and lapses. It also discusses stable individual differences in vulnerability to sleep loss.

**In Focus Check:** The reaction phase tracks correctness, median correct-response time and slow or missed responses. The extended check also uses a response-consistency measure.

**Important distinction:** The app's two-choice number comparison is **not a standard Psychomotor Vigilance Test (PVT)**. Standard PVT durations and lapse thresholds should not be transferred directly to this task.

### Processing efficiency — Jaeger (2018)

_Digit Symbol Substitution Test: The Case for Sensitivity Over Specificity in Neuropsychological Testing_ reviews the DSST as a sensitive but multifactorial cognitive task.

**In Focus Check:** The custom matching phase uses a visible letter-to-digit key and accounts for **both speed and accuracy**. Accuracy guardrails prevent fast guessing from producing top scores.

**Important distinction:** This is a **DSST-inspired task**, not a standardized or clinically validated DSST administration. Familiarity and practice can affect performance.

### Response inhibition — Jin et al. (2015)

_Recovery Sleep Reverses Impaired Response Inhibition due to Sleep Restriction_ examines sleep-loss-related changes in performance on a Go/No-Go task.

**In Focus Check:** The response-control phase distinguishes **commission errors** (responding to No-Go) from **omission errors** (failing to respond to Go) and tracks reaction times on correct Go responses.

**Important distinction:** Focus Check uses far fewer trials and its own browser-friendly timing. In Mini, there are only **two No-Go trials**, so one error can substantially change the observed error rate. Results should be interpreted cautiously.

### Subjective sleepiness — Åkerstedt & Gillberg (1990)

_Subjective and objective sleepiness in the active individual_ examines subjective sleepiness ratings alongside physiological indicators. The Karolinska Sleepiness Scale is a nine-point self-report measure of current sleepiness.

**In Focus Check:** Users can optionally report sleepiness on a **1–9** scale, or skip it. This is shown **separately** in the results and does **not** change the cognitive readiness score. Subjective feelings and objective task performance may convey different information.

## Scoring and limitations

The app estimates three domain scores on a 0–100 scale:

- **Alertness:** Accuracy, response speed and slow/missed responses (plus consistency in the extended check).
- **Processing efficiency:** Accuracy and response speed (plus consistency in the extended check).
- **Response control:** No-Go commission errors, Go omissions and correct Go response speed (plus consistency in the extended check).

The overall estimate uses an equal-weight average of the domain scores, with guardrails to stop a substantially weaker domain from being hidden by two strong ones. Scores are rounded to multiples of five.

| Score  | App label |
| ------ | --------- |
| 85–100 | Great     |
| 70–80  | Good      |
| 50–65  | Okay      |
| 0–45   | Low       |

**The scoring weights, speed thresholds, labels and recommendations are app-specific heuristics—not clinically validated norms or a calibrated measure of impairment.** “Limited” (Mini) and “Moderate” (extended) are qualitative labels reflecting test length, not statistical confidence intervals. Different devices, distractions, practice and task familiarity can affect results.

**Not for medical or safety-critical decisions.** A good Focus Check score cannot establish that a person is safe to drive, operate machinery or perform other high-risk activities.

## Project status

**Implemented:** Mini and extended presets, task introductions and practice, three objective scores, readiness summary, and optional KSS-inspired self-report (including Skip).

**Planned (not yet implemented):** Local test history and same-preset personal-baseline comparisons across previous completed tests. Baselines would be reported alongside—not substituted for—the current heuristic scores.

## Tech stack

- Next.js and React
- TypeScript
- CSS
- ESLint and Prettier

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run project checks before committing:

```bash
npm run check
npm run eslint
npm run build
```

## Research references

1. Hudson, A. N., Van Dongen, H. P. A., & Honn, K. A. (2020). _Sleep deprivation, vigilant attention, and brain function: A review_. **Neuropsychopharmacology, 45**, 21–30. https://doi.org/10.1038/s41386-019-0432-6
2. Jaeger, J. (2018). _Digit Symbol Substitution Test: The case for sensitivity over specificity in neuropsychological testing_. **Journal of Clinical Psychopharmacology, 38**(5), 513–519. https://doi.org/10.1097/JCP.0000000000000941
3. Jin, X., et al. (2015). _Recovery sleep reverses impaired response inhibition due to sleep restriction: Evidence from a visual event related potentials study_. **PLOS ONE, 10**(12), e0142361. https://doi.org/10.1371/journal.pone.0142361
4. Åkerstedt, T., & Gillberg, M. (1990). _Subjective and objective sleepiness in the active individual_. **International Journal of Neuroscience, 52**(1–2), 29–37. https://doi.org/10.3109/00207459008994241
