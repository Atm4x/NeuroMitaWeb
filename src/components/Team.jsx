import React from 'react';
import { useTranslation } from 'react-i18next';

const Team = () => {
  const { t } = useTranslation();
  const teamMembers = t('team.members', { returnObjects: true });

  return (
    <section className="section team-section">
      <div className="container">
        <h2 className="section-title">{t('team.title')}</h2>
        
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div className="team-member" key={index}>
              <h4>{member.name}</h4>
              <p>{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;