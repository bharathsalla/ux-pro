import { motion } from "framer-motion";
import { type PersonaId, personas } from "@/types/audit";
import heroIllustration from "@/assets/hero-illustration.png";

interface PersonaSelectProps {
  onSelect: (id: PersonaId) => void;
}

const PersonaSelect = ({ onSelect }: PersonaSelectProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col lg:flex-row"
    >
      {/* Left Column – Hero Illustration */}
      <div className="lg:w-1/2 flex items-center justify-center bg-surface-1 p-8 lg:p-16 lg:sticky lg:top-0 lg:h-screen">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="max-w-md w-full"
        >
          <img
            src={heroIllustration}
            alt="Designer sitting in a chair with headphones and coffee"
            className="w-full h-auto"
          />
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Design with <span className="text-gradient-primary">confidence.</span>
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              AI-powered audits tailored to your role.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Column – Persona Selection */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 lg:px-12 lg:py-16 lg:overflow-y-auto">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10 w-full max-w-lg"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface-2 text-sm text-muted-foreground mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            UX Audit Pro
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Who are you <span className="text-gradient-primary">auditing for?</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-sm mx-auto">
            Select your role to get a contextual, personalized audit experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
          {personas.map((persona, index) => (
            <motion.button
              key={persona.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.08 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(persona.id)}
              className={`group relative p-5 rounded-xl border border-border bg-card text-left transition-all duration-300 hover:border-${persona.color} hover:${persona.glowClass} focus:outline-none focus:ring-2 focus:ring-primary`}
            >
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-${persona.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{persona.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{persona.title}</h3>
                    <p className="text-xs text-muted-foreground">{persona.subtitle}</p>
                  </div>
                </div>
                <p className="text-xs text-secondary-foreground leading-relaxed line-clamp-2">
                  {persona.description}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  <span>Select</span>
                  <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-xs text-muted-foreground"
        >
          Each persona adapts the audit depth, language, and scoring weights.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PersonaSelect;
