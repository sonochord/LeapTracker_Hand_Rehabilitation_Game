import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from glob import glob

# Utility Functions
def calculate_distance(p1, p2):
    return np.sqrt(np.sum((p1 - p2) ** 2, axis=1))

def load_data(directory):
    all_files = glob(os.path.join(directory, '*.csv'))
    df_list = []
    required_columns = ['Client Name', 'Session Number', 'Exercise Name']

    for file in all_files:
        if 'metrics' in file:
            continue  # Skip metrics files
        try:
            df = pd.read_csv(file)
            print(f"Loaded file: {file}")
            print(f"Columns: {df.columns.tolist()}")
            missing_columns = [col for col in required_columns if col not in df.columns]
            if not missing_columns:
                df_list.append(df)
            else:
                print(f"Warning: Missing required columns {missing_columns} in file: {file}")
        except Exception as e:
            print(f"Error loading file {file}: {str(e)}")
            continue
    if df_list:
        all_data = pd.concat(df_list, ignore_index=True)
        print(f"Total rows in combined data: {len(all_data)}")
    else:
        all_data = pd.DataFrame()
        print("No valid data files found.")
    return all_data

def preprocess_data(df):
    if not df.empty:
        required_columns = ['Client Name', 'Session Number', 'Exercise Name']
        if all(col in df.columns for col in required_columns):
            print("Data shape before grouping:", df.shape)
            print("Unique values in grouping columns:")
            for col in required_columns:
                print(f"{col}: {df[col].nunique()}")
            
            try:
                group_size = df.groupby(required_columns).size()
                print("Group size shape:", group_size.shape)
                df.loc[:, 'Normalised_Time'] = df.groupby(required_columns).cumcount() / group_size
            except Exception as e:
                print(f"Error during normalisation: {str(e)}")
                print("Skipping time normalisation.")
        else:
            print("Warning: Required columns not found. Skipping time normalisation.")
            missing_columns = [col for col in required_columns if col not in df.columns]
            print(f"Missing columns: {missing_columns}")
    return df


def analyse_make_a_fist(df):
    def calculate_total_hand_closure(row):
        joint_angles = ['Thumb X', 'Thumb Y', 'Thumb Z', 
                        'Index X', 'Index Y', 'Index Z', 
                        'Middle X', 'Middle Y', 'Middle Z', 
                        'Ring X', 'Ring Y', 'Ring Z', 
                        'Pinky X', 'Pinky Y', 'Pinky Z']
        return row[joint_angles].sum()
    
    df.loc[:, 'Total Hand Closure'] = df.apply(calculate_total_hand_closure, axis=1)
    return df.groupby('Session Number')['Total Hand Closure'].agg(['min', 'max', 'mean', 'median', 'std'])

def analyse_thumb_touch(df):
    df['Thumb-Index Distance'] = calculate_distance(
        df[['Thumb X', 'Thumb Y', 'Thumb Z']].values,
        df[['Index X', 'Index Y', 'Index Z']].values
    )
    return df.groupby('Session Number')['Thumb-Index Distance'].agg(['min', 'max', 'mean', 'median', 'std'])

def analyse_pincer_grip(df):
    def calculate_total_flexion(row):
        joint_angles = ['Middle X', 'Middle Y', 'Middle Z', 
                        'Ring X', 'Ring Y', 'Ring Z', 
                        'Pinky X', 'Pinky Y', 'Pinky Z']
        return row[joint_angles].sum()
    
    df.loc[:, 'Total Flexion'] = df.apply(calculate_total_flexion, axis=1)
    df.loc[:, 'Pincer Grip Metric'] = df['Thumb-Index Distance'] + df['Total Flexion']
    return df.groupby('Session Number')['Pincer Grip Metric'].agg(['min', 'max', 'mean', 'median', 'std'])

def analyse_wrist_arom(df):
    df.loc[:, 'Total Wrist ROM'] = df['Wrist Flexion'] + df['Wrist Extension'] + df['Radial Deviation'] + df['Ulnar Deviation']
    
    def calculate_total_finger_rom(row):
        finger_joints = [
            'Thumb MCP', 'Thumb PIP', 'Thumb DIP',
            'Index MCP', 'Index PIP', 'Index DIP',
            'Middle MCP', 'Middle PIP', 'Middle DIP',
            'Ring MCP', 'Ring PIP', 'Ring DIP',
            'Pinky MCP', 'Pinky PIP', 'Pinky DIP'
        ]
        return row[finger_joints].sum()
    
    df.loc[:, 'Total Finger ROM'] = df.apply(calculate_total_finger_rom, axis=1)
    df.loc[:, 'Wrist AROM Metric'] = df['Total Wrist ROM'] + df['Total Finger ROM']
    return df.groupby('Session Number')['Wrist AROM Metric'].agg(['min', 'max', 'mean', 'median', 'std'])

def analyse_pronation_and_supination(df):
    required_columns = ['Palm Roll', 'Hand Roll', 'Session Number']
    if not all(col in df.columns for col in required_columns):
        raise ValueError("Missing required columns in the dataframe")

    df.loc[:, 'Palm Roll Change'] = df.groupby('Session Number')['Palm Roll'].diff()
    df.loc[:, 'Hand Roll Change'] = df.groupby('Session Number')['Hand Roll'].diff()
    
    df.loc[:, 'Movement'] = np.where(df['Palm Roll Change'] > 0, 'Supination', 'Pronation')
    df.loc[:, 'Cycle'] = (df['Movement'] != df['Movement'].shift()).cumsum()
    
    range_of_motion = df.groupby(['Session Number', 'Cycle'])['Palm Roll'].agg(['min', 'max']).eval('max - min')
    
    palm_roll_range = range_of_motion.groupby('Session Number').agg(['mean', 'max'])
    palm_roll_stats = df.groupby('Session Number')['Palm Roll'].agg(['min', 'max', 'mean', 'median', 'std'])
    hand_roll_stats = df.groupby('Session Number')['Hand Roll'].agg(['min', 'max', 'mean', 'median', 'std'])
    
    # Combine metrics
    combined_metric = (
        palm_roll_range['mean'] +
        palm_roll_stats['std'] +
        hand_roll_stats['std']
    ) / 3  # Average of the three components
    
    return pd.DataFrame({
        'Pronation Supination Metric': combined_metric,
        'Palm Roll Range Mean': palm_roll_range['mean'],
        'Palm Roll Std': palm_roll_stats['std'],
        'Hand Roll Std': hand_roll_stats['std']
    })

def plot_exercise_data(data, exercise_name, save_dir, client_name):
    plt.figure(figsize=(14, 10))
    
    # Prepare data for boxplot
    box_plot_data = [data[data['Session Number'] == session]['Value'] for session in sorted(data['Session Number'].unique())]
    
    # Create boxplot
    box_plot = plt.boxplot(box_plot_data, patch_artist=True)
    
    # Customize boxplot colors
    colors = ['lightblue'] * len(box_plot['boxes'])
    for patch, color in zip(box_plot['boxes'], colors):
        patch.set_facecolor(color)
    
    plt.title(f'{exercise_name.replace("_", " ").title()} - {client_name}')
    plt.xlabel('Session Number')
    plt.ylabel('Value')
    plt.xticks(range(1, len(data['Session Number'].unique()) + 1), [f'Session {i}' for i in sorted(data['Session Number'].unique())])
    plt.grid(True)
    
    # Add text annotations for each session
    for i, session in enumerate(sorted(data['Session Number'].unique()), 1):
        session_data = data[data['Session Number'] == session]['Value']
        metrics_text = (
            f"Session {session}:\n"
            f"Min: {session_data.min():.2f}\n"
            f"Max: {session_data.max():.2f}\n"
            f"Mean: {session_data.mean():.2f}\n"
            f"Median: {session_data.median():.2f}\n"
            f"Std dev: {session_data.std():.2f}\n"
            f"Range: {session_data.max() - session_data.min():.2f}"
        )
        plt.text(i, plt.ylim()[0], metrics_text, verticalalignment='bottom', horizontalalignment='center', fontsize=8, bbox=dict(facecolor='white', alpha=0.8))
    
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, f'{exercise_name}_plot.png'), dpi=300, bbox_inches='tight')
    plt.close()

def analyse_and_plot_all_exercises(df, save_dir):
    exercise_functions = {
        'make_a_fist': analyse_make_a_fist,
        'thumb_touch': analyse_thumb_touch,
        'pincer_grip': analyse_pincer_grip,
        'wrist_arom': analyse_wrist_arom,
        'pronation_supination': analyse_pronation_and_supination
    }

    client_name = df['Client Name'].iloc[0]

    for exercise_name, analysis_function in exercise_functions.items():
        exercise_data = df[df['Exercise Name'] == exercise_name]
        if not exercise_data.empty:
            try:
                result = analysis_function(exercise_data)
                
                result = result.reset_index()
                result = result.melt(id_vars='Session Number', var_name='Metric', value_name='Value')
                plot_exercise_data(result, exercise_name, save_dir, client_name)

                # Export summary statistics to CSV
                result.to_csv(os.path.join(save_dir, f'{exercise_name}_summary.csv'), index=False)
            except Exception as e:
                print(f"Error processing {exercise_name}: {str(e)}")
        else:
            print(f"No data available for {exercise_name}")

def safe_mean(series):
    return series.mean() if len(series) > 0 else np.nan

# Main Function
def main():
    directory = os.path.dirname(os.path.abspath(__file__))
    plot_save_dir = os.path.join(directory, 'plots')
    if not os.path.exists(plot_save_dir):
        try:
            os.makedirs(plot_save_dir)
            print(f"Created plots directory: {plot_save_dir}")
        except Exception as e:
            print(f"Error creating plots directory: {str(e)}")
            return

    if not os.access(plot_save_dir, os.W_OK):
        print(f"No write permission for plots directory: {plot_save_dir}")
        return

    all_data = load_data(directory)
    if all_data.empty:
        print("No valid data files found.")
        return

    print("Data types of columns:")
    print(all_data.dtypes)
    print("\nSample of the first few rows:")
    print(all_data.head())
    print("\nUnique values in 'Exercise Name' column:")
    print(all_data['Exercise Name'].unique())

    all_data = preprocess_data(all_data)

    analyse_and_plot_all_exercises(all_data, plot_save_dir)

    print("Analysis complete. Plots and summary CSV files have been generated and saved in the 'plots' directory.")

if __name__ == "__main__":
    main()