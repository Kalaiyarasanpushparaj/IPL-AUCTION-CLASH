import React from 'react';

type TeamLogoProps = {
    teamId: string;
    className?: string;
};

const logos: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    CSK: (props) => ( // Yellow
        <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill="#FFCB05" stroke="#004791" strokeWidth="4" />
            <text x="50" y="62" textAnchor="middle" fontSize="38" fontWeight="bold" fill="white">CSK</text>
        </svg>
    ),
    DC: (props) => ( // Blue
        <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="15" fill="#004C97" />
            <text x="50" y="62" textAnchor="middle" fontSize="40" fontWeight="bold" fill="white">DC</text>
        </svg>
    ),
    GT: (props) => ( // Dark Blue
        <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,0 100,50 50,100 0,50" fill="#1B2133"/>
            <text x="50" y="62" textAnchor="middle" fontSize="40" fontWeight="bold" fill="white">GT</text>
        </svg>
    ),
    KKR: (props) => ( // Purple
        <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="15" fill="#3A225D"/>
            <text x="50" y="62" textAnchor="middle" fontSize="35" fontWeight="bold" fill="white">KKR</text>
        </svg>
    ),
    LSG: (props) => ( // Cyan
        <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill="#00AEEF" stroke="white" strokeWidth="4" />
            <text x="50" y="62" textAnchor="middle" fontSize="35" fontWeight="bold" fill="white">LSG</text>
        </svg>
    ),
    MI: (props) => ( // Blue
        <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="15" fill="#004B8D" />
            <text x="50" y="62" textAnchor="middle" fontSize="40" fontWeight="bold" fill="white">MI</text>
        </svg>
    ),
    PBKS: (props) => ( // Red
        <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill="#DD1F2D" stroke="white" strokeWidth="4" />
            <text x="50" y="62" textAnchor="middle" fontSize="30" fontWeight="bold" fill="white">PBKS</text>
        </svg>
    ),
    RR: (props) => ( // Pink
        <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="15" fill="#E4007C" stroke="white" strokeWidth="4"/>
            <text x="50" y="62" textAnchor="middle" fontSize="40" fontWeight="bold" fill="white">RR</text>
        </svg>
    ),
    RCB: (props) => ( // Red/White
         <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill="#EC1C24" stroke="white" strokeWidth="4" />
            <text x="50" y="62" textAnchor="middle" fontSize="35" fontWeight="bold" fill="white">RCB</text>
        </svg>
    ),
    SRH: (props) => ( // Orange
        <svg {...props} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="15" fill="#F7A721"/>
            <text x="50" y="62" textAnchor="middle" fontSize="35" fontWeight="bold" fill="white">SRH</text>
        </svg>
    ),
};

export const TeamLogo: React.FC<TeamLogoProps> = ({ teamId, className }) => {
    const LogoComponent = logos[teamId];
    if (!LogoComponent) {
        // Fallback for an unknown teamId
        return (
            <div className={className}>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="48" fill="#cccccc" />
                    <text x="50" y="62" textAnchor="middle" fontSize="30" fontWeight="bold" fill="white">?</text>
                </svg>
            </div>
        );
    }
    return <LogoComponent className={className} />;
};
