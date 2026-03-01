import { motion } from "framer-motion";

export default function TimeBox({ label, value, phaseClass }) {
    return (
        <div
            className={`time-card ${phaseClass} relative w-[11.2rem] rounded-xl px-3 py-3 sm:w-[16rem] sm:px-4 sm:py-4`}
        >
            <div className="time-value-slot flex h-[6.2rem] items-center justify-center overflow-hidden sm:h-[8.2rem]">
                <motion.span
                    key={value}
                    initial={{ opacity: 0.2, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 340, damping: 27, mass: 0.56 }}
                    className="timer-digits text-[4.2rem] sm:text-[5.6rem]"
                >
                    {value}
                </motion.span>
            </div>
            <p className="time-label mt-1 text-sm tracking-[0.2em] text-slate-300 sm:mt-2 sm:text-base">{label}</p>
        </div>
    );
}
