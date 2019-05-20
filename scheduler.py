import time
import threading
import queue


class Scheduler(object):
    def __init__(self, resolution_sec=0.1):
        self.resolution_sec = resolution_sec
        self.work_queue = queue.Queue()
        self.task_list = []
        self.work_flag = True

        WorkerThread(self).start()

    def schedule(self, task):
        self.task_list.append(task)

    def un_schedule(self, task):
        self.task_list.remove(task)

    def stop(self):
        self.work_flag = False


class Task(object):
    def __init__(self, interval_sec, callback, run_once=True):
        super().__init__()
        self.elapsed_sec = 0
        self.interval_sec = interval_sec
        self.callback = callback
        self.run_once = run_once


class WorkerThread(threading.Thread):
    def __init__(self, scheduler):
        super().__init__()
        self.scheduler = scheduler

    def run(self):
        last_run_time_sec = time.monotonic()
        while self.scheduler.work_flag:
            this_run_time_sec = time.monotonic()
            delta_time_sec = this_run_time_sec - last_run_time_sec

            # Processing each timeout job:
            i_task = 0
            min_interval_rem_sec = 0
            while i_task < len(self.scheduler.task_list):
                task = self.scheduler.task_list[i_task]

                # Updating the task, and running callbacks as required:
                task.elapsed_sec += delta_time_sec
                if task.run_once:
                    if task.elapsed_sec >= task.interval_sec:
                        task.callback()
                        self.scheduler.task_list.remove(task)
                    else:
                        i_task += 1
                else:
                    while task.elapsed_sec >= task.interval_sec:
                        task.callback()
                        task.elapsed_sec -= task.interval_sec
                    i_task += 1

                # Computing how much time is left to wait before the next iteration of this task fires:
                if task.interval_sec - task.elapsed_sec < min_interval_rem_sec:
                    min_interval_rem_sec = task.interval_sec - task.elapsed_sec

            last_run_time_sec = this_run_time_sec

            time_elapsed_since_start_of_work = time.monotonic() - this_run_time_sec
            time.sleep(max(0, min_interval_rem_sec - time_elapsed_since_start_of_work))
