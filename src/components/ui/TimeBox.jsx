import { AnimatePresence, motion } from "framer-motion";

export default function TimeBox({ label, value, phaseClass }) {
    return (
        <div
            className={`time-card ${phaseClass} relative w-[9rem] rounded-xl px-2 py-3 sm:w-[14rem] sm:px-4 sm:py-4 md:w-[16rem]`}
        >
            <div className="time-value-slot relative flex h-[5.2rem] items-center justify-center overflow-hidden sm:h-[7.5rem] md:h-[8.2rem]">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={value}
                        initial={{ y: "110%", opacity: 0 }}
                        animate={{ y: "0%", opacity: 1 }}
                        exit={{ y: "-110%", opacity: 0 }}
                        transition={{
                            y: { type: "spring", stiffness: 280, damping: 28, mass: 0.65 },
                            opacity: { duration: 0.15 }
                        }}
                        style={{ position: "absolute" }}
                        className="timer-digits text-[3.4rem] sm:text-[5rem] md:text-[5.6rem]"
                    >
                        {value}
                    </motion.span>
                </AnimatePresence>
            </div>
            <p className="time-label mt-1 text-xs tracking-[0.2em] text-slate-300 sm:mt-2 sm:text-sm md:text-base">{label}</p>
        </div>
    );
}
