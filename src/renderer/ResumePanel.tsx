import type { Checkpoint } from '../shared/contracts';
import { Panel } from './Panel';

export function ResumePanel({ resume, stale, disabled }: { resume: Checkpoint | null; stale: boolean; disabled: boolean }) {
  return <Panel className="resume-panel" id="resume-heading" title="Resume Development" eyebrow="Project memory">
    {stale ? <p className="empty-copy">Resume information needs a fresh load. Use Retry loading above.</p> : resume ? <>
      <p className="resume-saved">Latest checkpoint · <time dateTime={resume.createdAt}>{new Date(resume.createdAt).toLocaleString()}</time></p>
      <div className="resume-context">
        <div><h3>Last accomplishment</h3><p>{resume.accomplished}</p></div>
        <div><h3>Next steps</h3><p>{resume.nextSteps}</p></div>
      </div>
      <div className="resume-footer"><button type="button" className="button button-primary" disabled={disabled} onClick={() => document.getElementById('action-title')?.focus()}>Continue with actions <span aria-hidden="true">→</span></button></div>
    </> : <>
      <p className="empty-copy">No checkpoint yet. Save what you accomplished and what to do next to leave a place to resume.</p>
      <div className="resume-footer"><button type="button" className="button button-primary" disabled={disabled} onClick={() => document.getElementById('accomplished')?.focus()}>Save your first checkpoint</button></div>
    </>}
  </Panel>;
}
