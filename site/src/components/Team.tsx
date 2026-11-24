import { Reveal } from '../lib/motion'
import { asset } from '../lib/asset'

const team = [
  {
    name: 'Masato Yoshikoshi',
    role: 'Founder & Principal',
    bio: 'Former head of ML platform at a FTSE 100 insurer. Masato leads strategy engagements and is usually the person asking the uncomfortable question.',
    photo: asset('images/team/masato-yoshikoshi.jpg'),
    focus: 'Strategy · Governance',
  },
  {
    name: 'Lukas Weber',
    role: 'Partner, Engineering',
    bio: 'Fifteen years building systems that cannot afford to be wrong. Lukas runs applied engineering, evaluation and the on-call handover.',
    photo: asset('images/team/lukas-weber.jpg'),
    focus: 'Systems · Evaluation',
  },
  {
    name: 'Yijun Quan',
    role: 'Partner, Data',
    bio: 'Data platforms and retrieval architecture. Yijun joins when the answer is less about models and more about the plumbing underneath them.',
    photo: asset('images/team/yijun-quan.jpg'),
    focus: 'Data · Retrieval',
  },
  {
    name: 'Anders Lindqvist',
    role: 'Head of Enablement',
    bio: 'Designs the workshops and internal playbooks. Anders has trained over 900 people across product, ops and leadership teams.',
    photo: asset('images/team/anders-lindqvist.jpg'),
    focus: 'Training · Adoption',
  },
  {
    name: 'Kuroki Yosuke',
    role: 'Partner, software',
    bio: 'Kuroki is a software engineer and researcher. He has built and deployed large-scale ML systems in production, and is an expert in model evaluation and monitoring.',
    focus: 'Software · Evaluation',
    photo: asset('images/team/kuroki-yosuke.jpg'),
  },
  {
    name: 'Sam Williams',
    role: 'Partner, software',
    bio: 'Sam is a software engineer and researcher. He has built and deployed large-scale ML systems in production, and is an expert in model evaluation and monitoring.',
    photo: asset('images/team/sam-williams.jpg'),
    focus: 'Software · Evaluation',
  }
]

export default function Team() {
  return (
    <section className="section team" id="team">
      <div className="shell">
        <div className="section__head section__head--split">
          <div>
            <Reveal>
              <p className="eyebrow">The people</p>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="section__title">
                Six partners. <em>No bench.</em>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={140} className="team__note">
            <p>
              Everyone who scopes your work is also on it. We deliberately stay small — it is the
              only way the person in the room can also read the code.
            </p>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <figure className="team__photo">
            <img
              src={asset('images/teammate.jpg')}
              alt="The ThinkWell AI team standing together in front of the ThinkWell AI logo"
              loading="lazy"
              decoding="async"
            />
          </figure>
        </Reveal>

        <div className="team__grid" role="region" aria-label="Partner profiles" tabIndex={0}>
          {team.map((person, i) => (
            <Reveal key={person.name} delay={i * 70} className="person-wrap">
              <article className="person">
                <div className="person__photo">
                  <img
                    src={person.photo}
                    alt={`${person.name}, ${person.role} at ThinkWell AI`}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="person__focus">{person.focus}</span>
                </div>
                <div className="person__body">
                  <h3 className="person__name">{person.name}</h3>
                  <p className="person__role">{person.role}</p>
                  <p className="person__bio">{person.bio}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="team__band">
            <div>
              <span className="team__band-num">12</span>
              <span className="team__band-label">
                senior specialists in our associate network, called in by problem — never by
                headcount.
              </span>
            </div>
            <a className="btn btn--line" href="#contact">
              Meet the team on a call
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
