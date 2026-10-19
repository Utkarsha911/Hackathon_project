import React from 'react';
import { useHackathon } from '../../context/HackathonContext';
import { UserCheck, CheckCircle2, Award, Scale, BookOpen, AlertCircle, FileSpreadsheet } from 'lucide-react';

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
    <section id="rules" className="py-24 bg-white border-b border-slate-200 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <div className="bic-section-label mb-2.5">Hackathon Governance</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Rules, Guidelines & Judging Matrix
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            BIC InnovateX adheres to strict academic and open-source standards. Review the
            eligibility rules, submission checkpoints, and weighted judging criteria.
          </p>
        </div>

        {/* Evaluation Criteria Matrix */}
        {evaluationCriteria.length > 0 && (
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-coral-600" />
              <h3 className="text-lg font-bold text-slate-900">Weighted Evaluation Criteria</h3>
              <span className="text-xs font-mono text-slate-500">Total: 100%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {evaluationCriteria.map((crit, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200/90 hover:border-coral-400 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-slate-500 uppercase font-semibold">
                        Criterion 0{idx + 1}
                      </span>
                      <span className="text-2xl font-extrabold font-mono text-coral-600">
                        {crit.weight}%
                      </span>
                    </div>

                    {/* Weight Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-4">
                      <div
                        className="bg-coral-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${crit.weight}%` }}
                      />
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mb-2">{crit.category}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{crit.description}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200 text-[11px] font-mono text-coral-700">
                    Weighted Official Jury Score
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3 Columns: Eligibility, Guidelines, Code of Conduct */}
        {(eligibility.length > 0 || submissionGuidelines.length > 0 || codeOfConduct.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Eligibility Card */}
            {eligibility.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/90 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2.5 mb-5 text-coral-600">
                  <UserCheck className="w-5 h-5" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">Eligibility Criteria</h4>
                </div>
                <ul className="space-y-3.5">
                  {eligibility.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-coral-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submission Guidelines Card */}
            {submissionGuidelines.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/90 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2.5 mb-5 text-coral-600">
                  <BookOpen className="w-5 h-5" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">Submission Requirements</h4>
                </div>
                <ul className="space-y-3.5">
                  {submissionGuidelines.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-coral-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Code of Conduct Card */}
            {codeOfConduct.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/90 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2.5 mb-5 text-coral-600">
                  <Scale className="w-5 h-5" />
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">Code of Conduct</h4>
                </div>
                <ul className="space-y-3.5">
                  {codeOfConduct.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-coral-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}
