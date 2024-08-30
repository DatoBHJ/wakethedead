import { IconPlus, IconSparkles } from '@/components/ui/icons';

interface FollowUp {
    choices: {
        message: {
            content: string;
        };
    }[];
}

const FollowUpComponent = ({ followUp, handleFollowUpClick }: { followUp: FollowUp; handleFollowUpClick: (question: string) => void }) => {
    const handleQuestionClick = (question: string) => {
        handleFollowUpClick(question);
    };

    return (
        <div className="backdrop-blur-sm bg-card-foreground/[3%] dark:bg-card-foreground/5 rounded-xl p-5 mt-4 transition-all duration-300">
            <div className="flex items-center mb-4">
                <IconSparkles className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
                <h2 className="text-xl font-medium text-purple-700 dark:text-purple-200">Related Questions</h2>
            </div>
            <ul className="space-y-3">
                {followUp.choices[0].message.content && JSON.parse(followUp.choices[0].message.content).followUp.map((question: string, index: number) => (
                    <li
                        key={index}
                        className="flex items-center cursor-pointer group"
                        onClick={() => handleQuestionClick(question)}
                    >
                        <IconPlus className="h-5 w-5 min-w-[1.25rem] text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-400 mr-3 transition-colors duration-200" />
                        <p className="text-base text-card-foreground dark:text-card-foreground group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">{question}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FollowUpComponent;