

const SignalLegend = () => {
    return (
        <div className="absolute top-3 left-3 z-10 bg-white backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase">Signal</span>
            <div className="flex-col">
                <div
                    className="w-24 h-2 rounded-full"
                    style={{ background: 'linear-gradient(to right, #22C55E, #EAB308, #EF4444)' }}
                />
                <div className="flex justify-between text-xs font-medium  text-gray-500  w-24">
                    <span>Strong</span>
                    <span>Weak</span>
                </div>
            </div>
            
        </div>
    );
};

export default SignalLegend;