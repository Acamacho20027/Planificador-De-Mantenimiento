#!/usr/bin/env python3
"""
Generate dashboard charts from the Node API (/api/tasks).

Usage:
  python scripts/generate_charts.py --api http://localhost:3000/api/tasks

Produces PNG files under ./charts/:
  - status_bar.png
  - status_pie.png
  - by_assignee.png

Requires: pandas, matplotlib, seaborn, requests
"""
import os
import sys
import argparse
from collections import Counter

import requests
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


def fetch_tasks(api_url):
    r = requests.get(api_url, timeout=5)
    r.raise_for_status()
    return r.json()


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def plot_status_counts(df, out_path):
    counts = df['status'].value_counts().reindex(['done', 'in_progress', 'not_started']).fillna(0)
    labels = ['Completadas', 'En progreso', 'No iniciadas']
    colors = ['#4CAF50', '#FFC107', '#F44336']

    sns.set_style('whitegrid')
    plt.figure(figsize=(6,4))
    sns.barplot(x=labels, y=counts.values, palette=colors)
    plt.title('Tareas por estado')
    plt.ylabel('Cantidad')
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()


def plot_status_pie(df, out_path):
    counts = df['status'].value_counts().reindex(['done', 'in_progress', 'not_started']).fillna(0)
    labels = ['Completadas', 'En progreso', 'No iniciadas']
    colors = ['#4CAF50', '#FFC107', '#F44336']
    plt.figure(figsize=(5,5))
    plt.pie(counts.values, labels=labels, colors=colors, autopct='%1.0f%%', startangle=140)
    plt.title('Distribución de estados')
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()


def plot_by_assignee(df, out_path):
    if 'assignedTo' not in df.columns or df['assignedTo'].dropna().shape[0] == 0:
        # nothing to plot
        plt.figure(figsize=(6,3))
        plt.text(0.5,0.5,'No hay tareas asignadas', ha='center', va='center')
        plt.axis('off')
        plt.savefig(out_path, dpi=150)
        plt.close()
        return

    counts = df.groupby(['assignedTo','status']).size().unstack(fill_value=0)
    # reorder columns
    counts = counts.reindex(columns=['done','in_progress','not_started'], fill_value=0)
    counts.plot(kind='bar', stacked=True, color=['#4CAF50', '#FFC107', '#F44336'], figsize=(8,4))
    plt.title('Tareas por asignado y estado')
    plt.ylabel('Cantidad')
    plt.legend(['Completadas','En progreso','No iniciadas'])
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()


def plot_single_state(state_label, count, color, out_path, max_count=1):
    """Create a single horizontal bar whose width/figure size is proportional to count.
    """
    # Determine figure width proportional to count (clamped)
    # base width 3 inches, add 0.6 inches per item, cap at 14
    width = max(3, min(14, 3 + 0.6 * count))
    height = 2.2

    sns.set_style('whitegrid')
    plt.figure(figsize=(width, height))
    plt.barh([0], [count], color=color)
    plt.xlim(0, max(max_count, count) * 1.1)
    plt.yticks([])
    plt.title(f"{state_label}: {count}")
    for i, v in enumerate([count]):
        plt.text(v + max(1, max_count*0.02), i, str(v), va='center')
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--api', default='http://localhost:3000/api/tasks', help='Tasks API URL')
    parser.add_argument('--out', default='charts', help='Output folder for generated charts')
    args = parser.parse_args()

    try:
        tasks = fetch_tasks(args.api)
    except Exception as e:
        print('ERROR: could not fetch tasks from', args.api, file=sys.stderr)
        print(str(e), file=sys.stderr)
        sys.exit(2)

    # normalize to DataFrame
    df = pd.json_normalize(tasks)
    if 'status' not in df.columns:
        df['status'] = 'not_started'

    ensure_dir(args.out)
    plot_status_counts(df, os.path.join(args.out, 'status_bar.png'))
    plot_status_pie(df, os.path.join(args.out, 'status_pie.png'))
    plot_by_assignee(df, os.path.join(args.out, 'by_assignee.png'))

    # generate one image per state sized proportionally to the count
    c = Counter(df['status'].fillna('not_started'))
    max_count = max(c.values()) if c else 1
    state_map = [('Completadas','done','#4CAF50'), ('En progreso','in_progress','#FFC107'), ('No iniciadas','not_started','#F44336')]
    for label, key, color in state_map:
        count = c.get(key, 0)
        out_file = os.path.join(args.out, f'state_{key}.png')
        plot_single_state(label, count, color, out_file, max_count=max_count)

    # Print concise summary
    c = Counter(df['status'].fillna('not_started'))
    summary = { 'done': c.get('done',0), 'in_progress': c.get('in_progress',0), 'not_started': c.get('not_started',0) }
    print('Charts generated in', args.out)
    print('Summary:', summary)


if __name__ == '__main__':
    main()
