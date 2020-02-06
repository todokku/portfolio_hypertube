import React, { useState, useEffect } from 'react';

import { getMovies } from '../../../data';

import Movie from './Movie';
import FilterIcon from './FilterIcon';
import Filter from './Filter';

import './index.css';

const Component = ({ match }) => {
    const genre = match.params.genre;
    const filter = match.params.filter;

    const [page, setPage] = useState(1);
    const [movies, setMovies] = useState([]);
    const [isSetting, setIsSetting] = useState(false);

    let isCancelled = false;

    useEffect((isCancelled) => {
        getMovies(genre, filter, 1, res => {
            if (!isCancelled && res !== null) {
                setMovies(res);
                setPage(page => page + 1);
            }
        });
        return () => {
            isCancelled = true;
        };
    }, [genre, filter]);

    let isWorking = false;

    const _handleScroll = e => {
        if (
            !isWorking &&
            e.target.scrollTop /
                (e.target.scrollHeight - e.target.clientHeight) >
                0.9
        ) {
            isWorking = true;
            getMovies(genre, filter, page, res => {
                if (!isCancelled && res !== null) {
                    setMovies([...movies, ...res],);
                    setPage(page => page + 1);
                }
                isWorking = false;
            });
        }
    };

    const _handleSetting = () => {
        setIsSetting(isSetting => !isSetting);
    };

    return (
        <div className="feed" onScroll={_handleScroll}>
            <div className="feed-container">
                <FilterIcon _handleSetting={_handleSetting} />
                {movies.map((movie, index) => (
                    <Movie movie={movie} key={index} />
                ))}
            </div>
            {isSetting ? (
                <Filter
                    genre={genre}
                    filter={filter}
                    _handleSetting={_handleSetting}
                />
            ) : null}
        </div>
    );
};

export default Component;