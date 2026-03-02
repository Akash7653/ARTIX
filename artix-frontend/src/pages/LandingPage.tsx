import React, { useState, useEffect } from 'react';
import { HeroSection, BackgroundColorSelector } from './HeroSection';
import { H1, H2, H3, Body, Eyebrow } from './Typography';
import './LandingPage.css';

/**
 * Premium Landing Page
 * Showcases ARTIX 2026 with video background, modern typography, and customization
 */
export function LandingPage() {
  const [showColorSelector, setShowColorSelector] = useState(false);
  const [bgColor, setBgColor] = useState('#000000');

  useEffect(() => {
    const savedColor = localStorage.getItem('artix_bg_color');
    if (savedColor) setBgColor(savedColor);
  }, []);

  const handleBgColorChange = (color) => {
    setBgColor(color);
  };

  const handleCTAClick = () => {
    // Scroll to registration section or navigate
    const registrationSection = document.getElementById('registration');
    registrationSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="w-full overflow-hidden bg-black">
      {/* Hero Section with Video Background */}
      <HeroSection
        title="ARTIX 2026"
        subtitle="Advanced Robotics and IoT Innovation eXchange"
        callToAction="Start Your Journey"
        onCTAClick={handleCTAClick}
        videoSrc="/assets/videos/iot-animation.mp4"
        posterImage="/assets/images/iot-poster.jpg"
      />

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Eyebrow className="mb-4">EVENT FEATURES</Eyebrow>
            <H2 className="mb-6">Experience the Future of Robotics</H2>
            <Body size="lg" className="text-gray-300 max-w-2xl mx-auto">
              ARTIX brings together innovators, students, and professionals to showcase cutting-edge IoT and robotics projects. Join us for three days of learning, collaboration, and innovation.
            </Body>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {/* Feature Card 1 */}
            <div className="group bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <H3 className="text-white mb-3">Innovation Showcase</H3>
              <Body size="sm" className="text-gray-400">
                Display your robotics and IoT projects to industry experts and fellow innovators. Get feedback and recognition for your work.
              </Body>
            </div>

            {/* Feature Card 2 */}
            <div className="group bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <H3 className="text-white mb-3">Workshops & Seminars</H3>
              <Body size="sm" className="text-gray-400">
                Learn from industry leaders through interactive workshops covering latest IoT technologies and robotics advancements.
              </Body>
            </div>

            {/* Feature Card 3 */}
            <div className="group bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-cyan-500/50 transition-all">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zM5 20a3 3 0 015.856-1.487M5 10a3 3 0 016 0v.25" />
                </svg>
              </div>
              <H3 className="text-white mb-3">Networking Opportunities</H3>
              <Body size="sm" className="text-gray-400">
                Connect with peers, mentors, and industry professionals. Build lasting relationships in the robotics community.
              </Body>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-t from-black to-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <Eyebrow className="mb-4">LIMITED SLOTS AVAILABLE</Eyebrow>
          <H2 className="mb-6">Don't Miss Out on ARTIX 2026</H2>
          <Body size="lg" className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Register now to secure your spot. Early bird registrations get exclusive benefits and merchandise.
          </Body>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCTAClick}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
            >
              Register Now
            </button>
            <button
              onClick={() => setShowColorSelector(!showColorSelector)}
              className="px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white font-bold rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {showColorSelector ? 'Hide' : 'Customize'} Theme
            </button>
          </div>
        </div>
      </section>

      {/* Background Color Customizer */}
      {showColorSelector && (
        <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 bg-black border-t border-gray-800">
          <div className="max-w-2xl mx-auto">
            <BackgroundColorSelector
              onColorChange={handleBgColorChange}
              defaultColor={bgColor}
            />
          </div>
        </section>
      )}

      {/* Registration Section */}
      <section
        id="registration"
        className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900"
      >
        <div className="max-w-4xl mx-auto text-center">
          <Eyebrow className="mb-4">GET STARTED</Eyebrow>
          <H2 className="mb-6">Join ARTIX 2026 Today</H2>
          <Body size="lg" className="text-gray-300 mb-8">
            Complete your registration to participate in India's premier IoT and Robotics event.
          </Body>
          
          {/* Placeholder for registration form */}
          <div className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-2xl p-12">
            <Body className="text-gray-400">
              Registration form will be integrated here. Click the button below to proceed.
            </Body>
            <button className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all duration-300">
              Open Registration Form
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <H3 className="text-white mb-4">ARTIX 2026</H3>
              <Body size="sm" className="text-gray-400">
                Advanced Robotics and IoT Innovation eXchange
              </Body>
            </div>
            <div>
              <Body className="font-semibold text-white mb-4">Quick Links</Body>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Events</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Register</a></li>
              </ul>
            </div>
            <div>
              <Body className="font-semibold text-white mb-4">Resources</Body>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">FAQs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Support</a></li>
              </ul>
            </div>
            <div>
              <Body className="font-semibold text-white mb-4">Follow Us</Body>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">LinkedIn</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Instagram</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <Body size="sm" className="text-gray-500">
                © 2026 ARTIX. All rights reserved.
              </Body>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition">Privacy Policy</a>
                <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition">Terms of Service</a>
                <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition">Contact</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
