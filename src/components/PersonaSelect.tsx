import { motion } from "framer-motion";
import { type PersonaId, personas } from "@/types/audit";
import heroCharacters from "@/assets/hero-characters.png";

interface PersonaSelectProps {
  onSelect: (id: PersonaId) => void;
}

const personaAccentBorder: Record<string, string> = {
  solo: "hover:border-persona-solo",
  lead: "hover:border-persona-lead",
  a11y: "hover:border-persona-a11y",
  founder: "hover:border-persona-founder",
  consultant: "hover:border-persona-consultant",
};

const personaIconBg: Record<string, string> = {
  solo: "bg-persona-solo/10 text-persona-solo",
  lead: "bg-persona-lead/10 text-persona-lead",
  a11y: "bg-persona-a11y/10 text-persona-a11y",
  founder: "bg-persona-founder/10 text-persona-founder",
  consultant: "bg-persona-consultant/10 text-persona-consultant",
};

const PersonaSelect = ({ onSelect }: PersonaSelectProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col lg:flex-row"
    >
      {/* Left Column – Hero */}
      <div className="lg:w-1/2 flex items-center justify-center bg-card p-8 lg:p-16 lg:sticky lg:top-0 lg:h-screen relative overflow-hidden border-r border-border">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="max-w-md w-full relative z-10"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <img
              src={heroCharacters}
              alt="UX Audit Pro characters"
              className="w-full h-auto max-h-[400px] object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Design with
              <span className="text-gradient-primary"> confidence.</span>
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg mt-3 leading-relaxed">
              AI-powered design audits built on 60+ UX/UI
              <br className="hidden sm:block" /> principles, laws & standards.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Column – Persona Cards */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 lg:px-12 lg:py-16 lg:overflow-y-auto bg-background">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10 w-full max-w-lg"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/30 bg-primary/5 text-sm text-primary font-semibold mb-6"
          >
            <span className="w-2 h-2 bg-primary animate-pulse" />
            UX Audit Pro
          </motion.div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-4 leading-[1.1]">
            Who are you
            <br />
            <span className="text-gradient-hero">auditing for?</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto leading-relaxed">
            Select your role to get a personalized audit experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-3 max-w-lg w-full">
          {personas.map((persona, index) => (
            <motion.button
              key={persona.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.06 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(persona.id)}
              className={`group relative flex items-center gap-4 p-5 border border-border bg-card text-left transition-all duration-300 card-hover focus:outline-none focus:ring-2 focus:ring-primary/50 ${personaAccentBorder[persona.id]}`}
            >
              <span className={`w-12 h-12 flex items-center justify-center text-2xl shrink-0 ${personaIconBg[persona.id]}`}>
                {persona.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-base text-foreground">
                    {persona.title}
                  </h3>
                  <span className="text-xs text-muted-foreground font-medium">
                    · {persona.subtitle}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed truncate">
                  {persona.description}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.button>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          Each persona adapts the audit depth, language & scoring.
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PersonaSelect;
