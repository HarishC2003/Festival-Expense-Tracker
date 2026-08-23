import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Briefcase, Globe, Code2 } from 'lucide-react';
import { Button } from '../ui/button';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-24 relative overflow-hidden bg-[#0a0a0a]">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/3"></div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-[2px] bg-gradient-to-r from-transparent to-[#D4AF37]"></div>
            <h2 className="text-4xl font-display font-bold text-[#F7F7F7] tracking-tight">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">Me</span>
            </h2>
            <div className="w-12 h-[2px] bg-gradient-to-l from-transparent to-[#D4AF37]"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            
            {/* Left Column - Profile Card */}
            <div className="md:col-span-4 space-y-6">
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="w-24 h-24 bg-gradient-to-br from-[#D4AF37] to-[#AA8529] rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3 group-hover:rotate-6 transition-transform duration-300">
                  <Code2 className="w-10 h-10 text-[#050505]" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Harish</h3>
                <p className="text-[#D4AF37] font-medium mb-6">Founder, HS Digital Solutions</p>
                
                <div className="flex flex-col gap-3">
                  <a href="https://www.linkedin.com/in/harish-c-sh" target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full justify-start border-white/10 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all bg-[#0a0a0a]">
                      <Briefcase className="w-4 h-4 mr-3" />
                      LinkedIn
                    </Button>
                  </a>
                  <a href="https://github.com/HarishC2003" target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full justify-start border-white/10 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all bg-[#0a0a0a]">
                      <Terminal className="w-4 h-4 mr-3" />
                      GitHub
                    </Button>
                  </a>
                  <a href="https://harishc2003.github.io/Portfolio/" target="_blank" rel="noreferrer">
                    <Button variant="outline" className="w-full justify-start border-white/10 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-all bg-[#0a0a0a]">
                      <Globe className="w-4 h-4 mr-3" />
                      Portfolio
                    </Button>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="md:col-span-8 text-white/70 space-y-5 leading-relaxed text-lg">
              <p>
                Hi, I'm <strong className="text-white font-medium">Harish</strong>, the founder of <strong className="text-[#D4AF37]">HS Digital Solutions</strong>. I am an MCA graduate and aspiring web developer with a strong interest in building modern, responsive, and user-friendly websites and web applications.
              </p>
              
              <p>
                My journey in web development has been driven by curiosity, continuous learning, and a passion for turning ideas into real, functional digital solutions. I have hands-on experience working on projects using technologies such as HTML, CSS, JavaScript, React, Node.js, Express.js, and databases.
              </p>

              <div className="bg-[#111] p-5 rounded-xl border border-white/5 my-6 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#D4AF37] to-transparent"></div>
                <p className="mb-3 text-white/90 font-medium">I have developed projects such as:</p>
                <ul className="list-disc list-inside space-y-3 text-white/80 marker:text-[#D4AF37]">
                  <li><strong className="text-[#D4AF37]">LunaTrack</strong> — a live web application designed with a focus on usability and practical functionality.</li>
                  <li><strong className="text-[#D4AF37]">SmartShelfX</strong> — an AI-based inventory management system that focuses on future demand prediction and automatic restocking.</li>
                </ul>
              </div>

              <p>
                I also use modern AI-powered development tools as part of my workflow to research, plan, build, debug, and improve applications more efficiently. I believe that combining technical knowledge, creativity, and AI-assisted development can help transform ideas into practical digital products.
              </p>
              
              <p>
                Through <span className="text-white font-medium">HS Digital Solutions</span>, my goal is to help businesses, startups, and individuals build a strong online presence through professional websites, responsive web applications, landing pages, and customized digital solutions.
              </p>
              
              <p>
                I am continuously learning, improving my skills, and exploring new technologies to deliver better and more effective solutions. My focus is simple: understand the client's needs, create a clean and functional solution, and build digital experiences that provide real value.
              </p>

              <p className="text-xl text-white font-display pt-4">
                Let's turn your ideas into something digital. <span className="inline-block hover:scale-125 transition-transform origin-bottom-left cursor-default ml-1">🚀</span>
              </p>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
};
