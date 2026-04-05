import React from 'react';
import './Experience.css';

const Experience = () => {
    return (
        <section className="experience-section">
            <div className="experience-gallery">
                <div className="experience-item item-large">
                    <img src="/placeholder.svg" alt="Luz suave e textura de pele" loading="lazy" />
                </div>

                <div className="experience-column">
                    <div className="experience-item item-small">
                        <img src="/placeholder.svg" alt="Luz de velas" loading="lazy" />
                    </div>
                    <div className="experience-title-container">
                        <h2 className="experience-title">A intimidade como<br />ritual.</h2>
                    </div>
                </div>

                <div className="experience-item item-medium">
                    <img src="/placeholder.svg" alt="Texturas naturais de tecido" loading="lazy" />
                </div>
            </div>
        </section>
    );
};

export default Experience;
