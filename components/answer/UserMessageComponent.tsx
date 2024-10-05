interface UserMessageComponentProps {
    message: string;
}

const UserMessageComponent: React.FC<UserMessageComponentProps> = ({ message }) => {
    return (
        <div className="px-1 py-2 mt-8 transition-all duration-300 ">
            <div className="flex items-center">
                <div className="ml-3 flex-grow">
                    <p className="text-2xl font-semibold text-card-foreground  dark:text-gray-400 font-mono">{message}</p>
                </div>
            </div>
        </div>
    );
};

export default UserMessageComponent;