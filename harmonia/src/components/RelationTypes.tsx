// הרמוניה — אופי הצירופים.
// השכבה המושגית שמעל החוקים הפרטניים: ניגוד, רצף (בשלושה כיוונים), וצירוף.
// אכרומטי — טקסט הוראה בלבד.
import { RELATION_NOTES } from '../data/content';

export function RelationTypes() {
  return (
    <ul className="rtypes" aria-label="אופי הצירופים">
      {RELATION_NOTES.map((r) => (
        <li key={r.title} className="rtype">
          <span className="rt-title">{r.title}</span>
          <span className="rt-body">{r.body}</span>
        </li>
      ))}
    </ul>
  );
}
