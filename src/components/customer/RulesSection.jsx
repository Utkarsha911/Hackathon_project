import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import Section from '../common/Section';
import SectionHeading from '../common/SectionHeading';
import Card from '../common/Card';
import ChecklistCard from '../common/ChecklistCard';
import { UserCheck, CheckCircle2, Scale, BookOpen, AlertCircle } from 'lucide-react';

export default function RulesSection() {
  const { hackathon, isLoadingApi } = useHackathon();
  const rules = hackathon?.rules || {};

  const eligibility = rules.eligibility || [];
  const submissionGuidelines = rules.submission_guidelines || [];
  const codeOfConduct = rules.code_of_conduct || [];
  const evaluationCriteria = rules.evaluation_criteria || [];

  const hasRulesContent =
    eligibility.length > 0 ||
    submissionGuidelines.length > 0 ||
    codeOfConduct.length > 0 ||
    evaluationCriteria.length > 0;

  if (!hasRulesContent && !isLoadingApi) {
    return null; // Don't render empty section if backend has no rules
  }

  return (
    <Section id="rules" tone="white" py="py-24">

      <SectionHeading label="Rules" title="The rules, and how we judge" className="mb-12">
        Who can join, what to hand in, and how the judges score it. Short read, worth it.
      </SectionHeading>

      {/* Evaluation Criteria Matrix */}
      {evaluationCriteria.length > 0 && (
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-xl font-extrabold text-ink">How you'll be scored</h3>
            <span className="text-xs font-mono text-slate-500">adds up to 100%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {evaluationCriteria.map((crit, idx) => (
              <Card
                key={idx}
                hover
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-slate-500">
                      #{idx + 1}
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-brand-blue">
                      {crit.weight}%
                    </span>
                  </div>

                  {/* Weight Progress Bar */}
                  <div className="w-full bg-brand-blue/15 h-2 rounded-full overflow-hidden mb-4">
                    <div
                      className="bg-brand-blue h-full"
                      style={{ width: `${crit.weight}%` }}
                    />
                  </div>

                  <h4 className="text-base font-bold text-ink mb-2">{crit.category}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{crit.description}</p>
                </div>


              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Eligibility, submission, conduct */}
      {(eligibility.length > 0 || submissionGuidelines.length > 0 || codeOfConduct.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {eligibility.length > 0 && (
            <ChecklistCard title="Who can join" headerIcon={UserCheck} icon={CheckCircle2} items={eligibility} />
          )}
          {submissionGuidelines.length > 0 && (
            <ChecklistCard title="What to submit" headerIcon={BookOpen} icon={CheckCircle2} items={submissionGuidelines} />
          )}
          {codeOfConduct.length > 0 && (
            <ChecklistCard title="Be decent" headerIcon={Scale} icon={AlertCircle} items={codeOfConduct} />
          )}
        </div>
      )}
    </Section>
  );
}
