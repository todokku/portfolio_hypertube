import React from 'react';

import { Link } from 'react-router-dom';

import './index.css';

export interface Props {}

const Component: React.FC<Props> = () => {
    return (
        <div className="header">
            <div className="header-ci-section">
                <Link to="/">
                    <div className="header-ci">HyperTube</div>
                </Link>
            </div>
            <div className="header-search-section">
                <div className="header-search-container">
                    <input
                        className="header-search-input"
                        placeholder="Search"
                    />
                    <button className="header-search-button"></button>
                </div>
            </div>
            <div className="header-util-section"></div>
        </div>
    );
};

export default Component;
